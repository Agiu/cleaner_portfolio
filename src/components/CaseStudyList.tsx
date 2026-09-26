import { caseStudies } from '../data/caseStudies'
import { CaseStudy } from './CaseStudy'
import { CaseStudyCompact } from './CaseStudyCompact'

/** How many studies get the full-size row; the rest drop into the condensed grid below. */
const FULL_ROWS = 3

export function CaseStudyList() {
  const featured = caseStudies.slice(0, FULL_ROWS)
  const more = caseStudies.slice(FULL_ROWS)

  return (
    <>
      <section className="cs-list" aria-label="Case studies">
        {featured.map((study) => (
          <CaseStudy key={study.slug} study={study} />
        ))}
      </section>

      {more.length > 0 && (
        <section className="cs-more" aria-labelledby="cs-more-title">
          <h2 id="cs-more-title" className="cs-more-title">
            More work
          </h2>
          <div className="cs-more-grid">
            {more.map((study) => (
              <CaseStudyCompact key={study.slug} study={study} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
