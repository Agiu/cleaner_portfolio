import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { CaseStudy as CaseStudyData } from '../data/caseStudies'
import { canExpand, expandToHero, fadeOutPage } from '../lib/pageTransition'
import { MediaBlock } from './MediaBlock'

/**
 * Condensed case study card, used once the list runs past the full-size rows: the image
 * (same scan reveal as every MediaBlock) with the full rows' meta, title and summary laid over it.
 * Opens with the ordinary page fade rather than the expand-to-hero transition. A study with a
 * video plays it on hover.
 */
export function CaseStudyCompact({ study }: { study: CaseStudyData }) {
  const navigate = useNavigate()
  // The video plays while the card is hovered and keeps going through the click into the hero.
  const [hovered, setHovered] = useState(false)
  const to = `/case-study/${study.slug}`

  // Plain clicks grow the image into the case study hero, like the full rows; mobile and
  // reduced motion fade the page instead.
  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    const page = e.currentTarget.closest<HTMLElement>('.layout-sidebar')
    const media = e.currentTarget.querySelector<HTMLElement>('.cs-compact-media')
    if (media && canExpand()) {
      await expandToHero(media, page)
      navigate(to, { state: { expanded: true } })
    } else {
      await fadeOutPage(page)
      navigate(to)
    }
  }

  return (
    <article className={`cs-compact${study.inkShadow ? ' cs-compact--shadow' : ''}`}>
      <Link
        to={to}
        className="cs-compact-link"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={(e) => {
          setHovered(false)
          // An inlined animation rewinds to its first frame (the still) for the next hover.
          e.currentTarget
            .querySelector('.cs-compact-anim svg')
            ?.getAnimations({ subtree: true })
            .forEach((a) => (a.currentTime = 0))
        }}
      >
        <MediaBlock src={study.image} video={study.video} videoStart={study.videoStart} play={hovered} className="cs-compact-media">
          {study.animation && <HoverAnimation src={study.animation} />}
          {/* Laid out like the full rows' panel: meta up top, title and summary at the foot.
              On hover devices only the title shows until hover (see .cs-compact-info). */}
          <div className="cs-compact-info">
            <div className="cs-meta cs-compact-meta">
              <span>{study.category}</span>
              <span>{study.year}</span>
            </div>
            <div className="cs-compact-body">
              <h3 className="cs-title">{study.title}</h3>
              {/* Collapses to nothing at rest on hover devices; opening it pushes the title up. */}
              <div className="cs-compact-more">
                <div>
                  <p className="cs-summary cs-compact-summary">{study.summary}</p>
                </div>
              </div>
            </div>
          </div>
        </MediaBlock>
      </Link>
    </article>
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
