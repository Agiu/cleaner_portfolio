import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import type { Palette } from '../lib/timeOfDay'
import { scrollToTarget } from '../lib/useSmoothScroll'
import { createReel, SCENE_COUNT, STILL_TIME, type Hud } from '../lib/workReel'
import { ArrowLink } from './Profile'

/*
 * Home header: a looping motion-graphic reel of the work (see lib/workReel.ts), in black and
 * white.
 */

/** The header is black and white: a near-black ground, white linework, one grey between. */
const HEADER_BG = '#010101'
const PALETTE: Palette = { lo: [1 / 255, 1 / 255, 1 / 255], mid: [0x7a / 255, 0x7a / 255, 0x7a / 255], hi: [1, 1, 1] }

// Kept outside the component so a remount (React's dev double-mount, or coming back to Work)
// continues the reel where it was instead of restarting it and replaying the entrance.
let reelClock = 0
let entrancePlayed = false

export function HomeHeader() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const cta = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  // Set once the reel is up: pressing a progress segment jumps to that slide.
  const jump = useRef<(i: number) => void>(() => {})

  // The call to action under the title scrolls down to the case study list.
  const goToWork = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const target = document.querySelector<HTMLElement>('.cs-list')
    if (target) scrollToTarget(target)
  }

  useGSAP(
    () => {
      const el = root.current!
      const cv = canvas.current!
      const reel = createReel(cv)
      if (!reel) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const pointer = { x: -9999, y: -9999 }
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        pointer.x = e.clientX - r.left
        pointer.y = e.clientY - r.top
      }
      const onLeave = () => {
        pointer.x = pointer.y = -9999
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)

      // Keep the DOM call to action pinned under the canvas title. It stays put and visible while
      // the titles hand over.
      // The progress bar is drawn on the canvas too; its buttons sit over it, one per segment.
      let shownIdx = -1
      const place = (hud: Hud | undefined) => {
        if (!hud) return
        if (cta.current) gsap.set(cta.current, { x: hud.x, y: hud.y })
        if (bar.current) {
          gsap.set(bar.current, { x: hud.bar.x, y: hud.bar.y })
          if (hud.idx !== shownIdx) {
            shownIdx = hud.idx
            Array.from(bar.current.children).forEach((b, i) =>
              i === shownIdx ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'),
            )
          }
        }
      }

      const render = () => place(reel.draw(reelClock, PALETTE, pointer))

      const resize = () => {
        const r = el.getBoundingClientRect()
        reel.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2))
        render()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(el)
      // Labels are canvas text: redraw once the web font is in.
      document.fonts.ready.then(render)
      // Project Open's model loads separately; redraw once it's in (matters for the still frame).
      reel.modelReady?.then(render)

      const teardown = () => {
        ro.disconnect()
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }

      // Dip the art out, then start the chosen slide drawing itself on from nothing, so nothing
      // is cut off mid-move.
      jump.current = (i) => {
        if (reduce) {
          reelClock = reel.jumpTo(i, reelClock) + STILL_TIME
          render()
          return
        }
        gsap.to(cv, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
          overwrite: true,
          onComplete: () => {
            reelClock = reel.jumpTo(i, reelClock) + 0.35
            render()
            gsap.to(cv, { opacity: 1, duration: 0.35, ease: 'power2.out' })
          },
        })
      }

      if (reduce) {
        // One settled frame, no motion.
        reelClock = STILL_TIME
        render()
        gsap.set(el, { autoAlpha: 1 })
        return teardown
      }

      // Share GSAP's ticker with Lenis/ScrollTrigger; the reel's clock only runs while visible.
      let visible = true
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
      io.observe(el)

      // Background parallax (desktop): as the page scrolls, the reel drifts down at a third of the
      // scroll speed while the case studies slide up over it, and fades out. Once it's gone it
      // stops drawing; scrolling back up brings it back where it left off. Phones skip it: there
      // the name sits in the page flow right under the header, and the drift would cover it.
      const wrap = el.parentElement!
      let faded = false
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        gsap.fromTo(
          wrap,
          { y: 0, opacity: 1 },
          {
            y: () => el.offsetHeight * 0.35,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top top',
              end: () => `+=${el.offsetHeight * 0.8}`,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => (faded = self.progress > 0.98),
            },
          },
        )
        return () => {
          faded = false
        }
      })

      // On high-refresh screens the reel draws every other (or every few) ticks, so it runs at 60fps
      // or a little over rather than 120-240: it looks the same and costs a fraction as much. The
      // clock still advances every tick. frameMs is a running average of the screen's frame time.
      let frameMs = 1000 / 60
      let frame = 0
      const tick = (_time: number, dt: number) => {
        if (!visible || faded) return
        const step = Math.min(dt, 100)
        reelClock += step / 1000
        frameMs += (step - frameMs) * 0.05
        const every = Math.max(1, Math.floor(1000 / 60 / frameMs + 0.1))
        if (++frame % every === 0) render()
      }
      gsap.ticker.add(tick)

      if (entrancePlayed) {
        gsap.set(el, { autoAlpha: 1 })
      } else {
        gsap.fromTo(
          el,
          { clipPath: 'inset(4% 4% 4% 4%)', autoAlpha: 0 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            autoAlpha: 1,
            duration: 1.4,
            delay: 0.15,
            // Only once it has actually finished: a remount that cuts it short replays it.
            onComplete: () => {
              entrancePlayed = true
            },
          },
        )
      }

      return () => {
        mm.revert()
        gsap.ticker.remove(tick)
        io.disconnect()
        teardown()
      }
    },
    { scope: root },
  )

  return (
    <div className="hh-wrap">
      <div ref={root} className="home-header" style={{ backgroundColor: HEADER_BG }}>
        <canvas
          ref={canvas}
          className="hh-field"
          role="img"
          aria-label="A looping reel of selected work: Project Open, Xbox Arcade, ForeFlight and Who Owns Seattle."
        />
        <div ref={cta} className="hh-cta">
          <ArrowLink href="#work" label="See all work" down onClick={goToWork} />
        </div>
        <div ref={bar} className="hh-progress" role="group" aria-label="Slides">
          {Array.from({ length: SCENE_COUNT }, (_, i) => (
            <button key={i} type="button" aria-label={`Slide ${i + 1} of ${SCENE_COUNT}`} onClick={() => jump.current(i)} />
          ))}
        </div>
      </div>
    </div>
  )
}
