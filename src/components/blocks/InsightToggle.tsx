import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'
import { fenceParts } from './Stage'

/*
 * ```insight-toggle: two (or more) sets of findings on the light sheet, one shown at a time, with
 * tabs to switch: a `## Set name` line starts each set, then `Title | Description` per finding.
 * Switching deals the new set in, one finding after another.
 */
export function InsightToggle({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const sets: { name: string; items: string[][] }[] = []
  for (const line of content.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith('## ')) sets.push({ name: line.slice(3), items: [] })
    else sets[sets.length - 1]?.items.push(fenceParts(line))
  }
  const [shown, setShown] = useState(0)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(gsap.utils.selector(root)('.insight-card'), { y: 28, autoAlpha: 0, stagger: 0.08, duration: 0.8 })
      })
    },
    { scope: root, dependencies: [shown] },
  )

  if (!sets.length) return null
  return (
    <div ref={root} className="insight-toggle sv-sheet--light sv-feature-panel">
      <SheetMarks />
      <div className="insight-tabs" role="tablist" aria-label="Insights">
        {sets.map((set, i) => (
          <button
            key={set.name}
            type="button"
            role="tab"
            aria-selected={i === shown}
            className={`insight-tab${i === shown ? ' is-active' : ''}`}
            onClick={() => setShown(i)}
          >
            {set.name}
          </button>
        ))}
      </div>
      <ol className="insight-cards" role="tabpanel" aria-label={sets[shown].name}>
        {sets[shown].items.map(([title, text], i) => (
          <li key={`${shown}-${i}`} className="insight-card">
            <span className="insight-card-n">{String(i + 1).padStart(2, '0')}</span>
            <p className="insight-card-title">{title}</p>
            {text && <p>{text}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
