import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CaseStudy as CaseStudyData } from '../data/caseStudies'
import { canExpand, expandToHero, fadeOutPage, fadeToSite } from '../lib/pageTransition'
import { scrollToTarget } from '../lib/useSmoothScroll'
import { unlocked } from '../lib/protectedPages'
import { requestUnlock } from '../lib/unlockGate'
import { coverScenes, titledCovers } from './covers'
import { MediaBlock } from './MediaBlock'

/**
 * Condensed case study card, used once the list runs past the full-size rows: the image
 * (same scan reveal as every MediaBlock) with the full rows' meta, title and summary laid over it.
 * Opens with the ordinary page fade rather than the expand-to-hero transition. A study with a
 * video plays it on hover. A locked study's card shows a lock by its title and doesn't open.
 * `fade`: always open with the page fade (the recommendations at the foot of a case study).
 */
export function CaseStudyCompact({ study, fade = false }: { study: CaseStudyData; fade?: boolean }) {
  const navigate = useNavigate()
  // The video plays while the card is hovered and keeps going through the click into the hero.
  const [hovered, setHovered] = useState(false)
  const to = study.href?.url ?? `/case-study/${study.slug}`
  // A study with a built cover (covers/) shows it in place of its image, as on the full rows.
  const CoverScene = coverScenes[study.slug]

  // Plain clicks grow the image into the case study hero, like the full rows; mobile and
  // reduced motion fade the page instead.
  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    // A study that opens another site fades into it.
    if (study.href) return fadeToSite(study.href.url, study.href.color)
    // A protected study asks for its password first.
    if (study.protected && !unlocked(study.slug) && !(await requestUnlock(study.slug, study.title))) return
    const page = e.currentTarget.closest<HTMLElement>('.layout-sidebar')
    const media = e.currentTarget.querySelector<HTMLElement>('.cs-compact-media')
    if (media && !fade && canExpand()) {
      await expandToHero(media, page)
      navigate(to, { state: { expanded: true } })
    } else {
      await fadeOutPage(page)
      // From the foot of a case study, start the next one at the top: its scroll animations set up
      // before the route's scroll reset, and ones passed already (set to run once) break GSAP.
      if (fade) scrollToTarget(0, { immediate: true })
      navigate(to)
    }
  }

  const hover = {
    className: 'cs-compact-link',
    onMouseEnter: () => setHovered(true),
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      setHovered(false)
      // An inlined animation rewinds to its first frame (the still) for the next hover.
      e.currentTarget
        .querySelector('.cs-compact-anim svg')
        ?.getAnimations({ subtree: true })
        .forEach((a) => (a.currentTime = 0))
    },
  }

  const card = (
    <MediaBlock src={CoverScene ? undefined : study.image} video={study.video} videoStart={study.videoStart} play={hovered} className="cs-compact-media">
      {CoverScene && <CoverScene />}
      {study.animation && <HoverAnimation src={study.animation} />}
      {/* Laid out like the full rows' panel: meta up top, title and summary at the foot.
          On hover devices only the title shows until hover (see .cs-compact-info). A built cover
          spells out the title itself, so it goes without; the title stays for screen readers. */}
      <div className={`cs-compact-info${titledCovers.has(study.slug) ? ' visually-hidden' : ''}`}>
        <div className="cs-meta cs-compact-meta">
          <span>{study.category}</span>
          <span>{study.year}</span>
        </div>
        <div className="cs-compact-body">
          <h3 className="cs-title">
            {study.title}
            {study.locked && <Lock />}
          </h3>
          {/* Collapses to nothing at rest on hover devices; opening it pushes the title up. */}
          <div className="cs-compact-more">
            <div>
              <p className="cs-summary cs-compact-summary">{study.summary}</p>
            </div>
          </div>
        </div>
      </div>
    </MediaBlock>
  )

  return (
    <article className={`cs-compact${study.inkShadow ? ' cs-compact--shadow' : ''}${study.locked ? ' cs-compact--locked' : ''}`}>
      {/* A locked card keeps its hover but isn't a link. */}
      {study.locked ? (
        <div {...hover} aria-disabled="true">
          {card}
        </div>
      ) : (
        <Link to={to} onClick={onClick} {...hover}>
          {card}
        </Link>
      )}
    </article>
  )
}

/** A padlock in the title's colour, for a study that isn't open yet. */
function Lock() {
  return (
    <svg className="cs-lock" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" role="img" aria-label="Locked">
      <rect x="1" y="6" width="10" height="7.25" rx="1" />
      <path d="M3.25 6V4a2.75 2.75 0 0 1 5.5 0v2" />
    </svg>
  )
}

/**
 * A study's animated SVG, inlined over its still so the page's CSS can hold it on its first
 * frame and play it only while the card is hovered (see .cs-compact-anim). An <img> can't be
 * paused from outside. The file's own class and keyframe names are prefixed, since inlining
 * makes them global.
 */
function HoverAnimation({ src }: { src: string }) {
  const [markup, setMarkup] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    fetch(src)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => live && setMarkup(text))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [src])
  if (!markup) return null
  return <div className="cs-compact-anim" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
}
