import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CaseStudy as CaseStudyData } from '../data/caseStudies'
import { hasRevealed, markRevealed } from '../lib/revealed'
import { gsap, useGSAP } from '../lib/gsap'
import { canExpand, expandToHero } from '../lib/pageTransition'

type Props = {
  study: CaseStudyData
  /** Already in place when scrolled to: no rise-in and no reveal (the first row, under the header). */
  settled?: boolean
}

/**
 * One case study row. The motion is split in two layers:
 *  - Position (rise-in, image parallax) is scrubbed to scroll, so it tracks
 *    the Lenis-smoothed scroll 1:1 and never feels "late".
 *  - Reveals (panel sheet wipe, text stagger) are time-based with an expo
 *    ease, played on enter and reversed on leave-back, so they always land
 *    with the same crisp timing regardless of scroll speed.
 */
export function CaseStudy({ study, settled = false }: Props) {
  const root = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const to = `/case-study/${study.slug}`

  // Plain clicks grow the image into the case study hero before navigating;
  // modified clicks (new tab etc.), mobile and reduced motion navigate normally.
  const onClick = async (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !canExpand()) return
    const media = root.current?.querySelector<HTMLElement>('.cs-media')
    if (!media) return
    e.preventDefault()
    await expandToHero(media, root.current!.closest('.layout-sidebar'))
    navigate(to, { state: { expanded: true } })
  }

  useGSAP(
    (_, contextSafe) => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: '(min-width: 900px)',
          motion: '(prefers-reduced-motion: no-preference)',
          finePointer: '(hover: hover) and (pointer: fine)',
        },
        (ctx) => {
          const { desktop, motion, finePointer } = ctx.conditions as Record<string, boolean>
          if (!motion) return

          const trigger = root.current
          // The sheet wipes away from the image, toward the row's outer edge.
          const away = study.mediaSide === 'left' ? 1 : -1
          const axis = desktop ? 'xPercent' : 'yPercent'
          const sheetTo = desktop ? away * 101 : 101
          const contentFrom = desktop ? { x: -away * 40 } : { y: -24 }

          // A row already peeking above the fold on load skips the scrubbed rise-in (it would sit
          // half-faded) and plays its reveal straight away, which draws the eye down the page.
          const onScreenAtLoad = trigger!.getBoundingClientRect().top < window.innerHeight

          // 1. Rise-in: row travels up and fades in from 0% as it enters the viewport.
          if (!onScreenAtLoad && !settled) gsap.fromTo(
            q('.cs-inner'),
            { y: 105, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              ease: 'none',
              scrollTrigger: { trigger, start: 'top bottom', end: 'top 55%', scrub: true },
            },
          )

          // 2. Image parallax across the row's full pass through the viewport.
          gsap.fromTo(
            q('.cs-parallax'),
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: 'none',
              scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
          const hasFloat = q('.cs-float').length > 0 // placeholder mock-up card, absent with a real image
          if (hasFloat) {
            gsap.fromTo(
              q('.cs-float'),
              { y: 70 },
              {
                y: -40,
                ease: 'none',
                scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
              },
            )
          }

          // 3. Reveal: sheet wipes off the text panel, content follows it in. Once per visit —
          //    it doesn't reverse on scroll-up or replay when returning to the list.
          const revealKey = `card:${study.slug}`
          if (!settled && !hasRevealed(revealKey)) {
            gsap
              .timeline({
                scrollTrigger: { trigger, start: onScreenAtLoad ? 'top bottom' : 'top 78%', once: true },
                onStart: () => markRevealed(revealKey),
              })
              .fromTo(q('.cs-media'), { clipPath: 'inset(6% 6% 6% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4 }, 0)
              .fromTo(q('.cs-media'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 0)
              .fromTo(q('.cs-media-scale'), { scale: 1.18 }, { scale: 1, duration: 1.6 }, 0)
              .fromTo(q('.cs-sheet'), { [axis]: 0, autoAlpha: 1 }, { [axis]: sheetTo, duration: 1.3, ease: 'expo.inOut' }, 0.05)
              .fromTo(
                q('.cs-reveal'),
                { ...contentFrom, autoAlpha: 0 },
                { x: 0, y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.07 },
                0.55,
              )
          }

          // 4. Hover: quickTo reuses one tween per property, so rapid
          //    enter/leave never stacks or snaps.
          if (!finePointer || !contextSafe) return
          // quickTo needs individual properties; 'scale' is a shorthand for scaleX + scaleY.
          const scaleXTo = gsap.quickTo(q('.cs-hover'), 'scaleX', { duration: 0.9, ease: 'expo.out' })
          const scaleYTo = gsap.quickTo(q('.cs-hover'), 'scaleY', { duration: 0.9, ease: 'expo.out' })
          const scaleTo = (v: number) => {
            scaleXTo(v)
            scaleYTo(v)
          }
          const liftTo = hasFloat ? gsap.quickTo(q('.cs-float-hover'), 'y', { duration: 0.9, ease: 'expo.out' }) : null

          const enter = contextSafe(() => {
            scaleTo(1.045)
            liftTo?.(-14)
          })
          const leave = contextSafe(() => {
            scaleTo(1)
            liftTo?.(0)
          })

          const link = q('.cs-inner')[0]
          link.addEventListener('mouseenter', enter)
          link.addEventListener('mouseleave', leave)
          return () => {
            link.removeEventListener('mouseenter', enter)
            link.removeEventListener('mouseleave', leave)
          }
        },
      )
    },
    { scope: root, dependencies: [study.mediaSide, settled] },
  )

  return (
    <article
      ref={root}
      className="cs"
      data-slug={study.slug}
      data-side={study.mediaSide}
      style={{ '--media': study.mediaRatio } as React.CSSProperties}
    >
      <Link className="cs-inner" to={to} onClick={onClick}>
        <div className="cs-media">
          <div className="cs-hover">
            <div className="cs-media-scale">
              <div className="cs-parallax">
                {study.image ? <img src={study.image} alt="" /> : <div className="cs-placeholder" />}
              </div>
            </div>
          </div>
          {!study.image && (
            <div className="cs-float" aria-hidden="true">
              <div className="cs-float-hover" />
            </div>
          )}
        </div>

        <div className="cs-panel">
          <div className="cs-content">
            <div className="cs-meta cs-reveal">
              <span>{study.category}</span>
              <span>{study.year}</span>
            </div>
            <div className="cs-body">
              <h3 className="cs-title cs-reveal">{study.title}</h3>
              <p className="cs-summary cs-reveal">{study.summary}</p>
            </div>
          </div>
          <div className="cs-sheet" aria-hidden="true" />
        </div>
      </Link>
    </article>
  )
}
