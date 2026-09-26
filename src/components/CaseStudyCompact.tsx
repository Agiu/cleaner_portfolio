import { Link, useNavigate } from 'react-router-dom'
import type { CaseStudy as CaseStudyData } from '../data/caseStudies'
import { fadeOutPage } from '../lib/pageTransition'
import { MediaBlock } from './MediaBlock'

/**
 * Condensed case study card, used once the list runs past the full-size rows: the image
 * (same scan reveal as every MediaBlock) with the full rows' meta, title and summary laid over it.
 * Opens with the ordinary page fade rather than the expand-to-hero transition.
 */
export function CaseStudyCompact({ study }: { study: CaseStudyData }) {
  const navigate = useNavigate()
  const to = `/case-study/${study.slug}`

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    await fadeOutPage(e.currentTarget.closest<HTMLElement>('.layout-sidebar'))
    navigate(to)
  }

  return (
    <article className="cs-compact">
      <Link to={to} className="cs-compact-link" onClick={onClick}>
        <MediaBlock src={study.image} className="cs-compact-media">
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
