import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'
import { fenceParts } from './Stage'

/*
 * ```audit: an outside audit's findings, set out on a light drawing sheet in place of its slides.
 * A title, what's working against what could be improved, the themes of its recommendations, a
 * bar chart (where search traffic comes from), and the source. One line each, by kind:
 *
 *   title | What the audit found
 *   pair | What's working | What could be improved
 *   theme | Title | Recommendation
 *   columns | 2                  (themes across; four by default)
 *   chart | Chart title | Note under it
 *   bar | Label | 41.66          (a share, in percent)
 *   source | Who made the audit, and of what
 *
 * The rows rise in and the bars grow as the sheet scrolls into view (and back out above it).
 */

type Line = string[]

export function Audit({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => fenceParts(l))
  const of = (kind: string) => lines.filter(([k]) => k === kind).map(([, ...rest]) => rest as Line)
  const [title] = of('title')[0] ?? []
  const pairs = of('pair')
  const themes = of('theme')
  const [chartTitle, chartNote] = of('chart')[0] ?? []
  const bars = of('bar').map(([label, share]) => ({ label, share: Number(share) }))
  const [source] = of('source')[0] ?? []
  const [columns] = of('columns')[0] ?? []
  const top = Math.max(...bars.map((b) => b.share), 1)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const tl = gsap
          .timeline({ paused: true })
          .from(q('.audit-title, .audit-pair, .audit-theme, .audit-chart-head, .audit-bar'), { y: 24, autoAlpha: 0, stagger: 0.05, duration: 0.8 }, 0)
          .from(q('.audit-bar-fill'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.06, duration: 1.2 }, 0.5)
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          onEnter: () => tl.timeScale(1).play(),
          onLeaveBack: () => tl.timeScale(1.6).reverse(),
        })
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="audit">
      <div className="audit-sheet sv-sheet--light sv-feature-panel">
        <SheetMarks />
        {title && <h4 className="audit-title">{title}</h4>}

        {pairs.length > 0 && (
          <div className="audit-pairs" role="table" aria-label="What's working and what could be improved">
            <div className="audit-pair audit-pair--head" role="row">
              <span role="columnheader">What’s working</span>
              <span role="columnheader">What could be improved</span>
            </div>
            {pairs.map(([working, improve], i) => (
              <div key={i} className="audit-pair" role="row">
                <span role="cell" data-label="What’s working">
                  {working}
                </span>
                <span role="cell" data-label="What could be improved">
                  {improve}
                </span>
              </div>
            ))}
          </div>
        )}

        {themes.length > 0 && (
          <ul className="audit-themes" style={columns ? ({ '--audit-columns': columns } as React.CSSProperties) : undefined}>
            {themes.map(([name, text]) => (
              <li key={name} className="audit-theme">
                <p className="audit-theme-name">{name}</p>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        )}

        {bars.length > 0 && (
          <div className="audit-chart">
            <div className="audit-chart-head">
              {chartTitle && <p className="audit-chart-title">{chartTitle}</p>}
              {chartNote && <p className="audit-chart-note">{chartNote}</p>}
            </div>
            <ol className="audit-bars">
              {bars.map(({ label, share }) => (
                <li key={label} className="audit-bar">
                  <span className="audit-bar-label">{label}</span>
                  <span className="audit-bar-track" aria-hidden="true">
                    <span className="audit-bar-fill" style={{ width: `${(share / top) * 100}%` }} />
                  </span>
                  <span className="audit-bar-value">{share.toFixed(1)}%</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {source && <p className="audit-source">Source: {source}</p>}
    </div>
  )
}
