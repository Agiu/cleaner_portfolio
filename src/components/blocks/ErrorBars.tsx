import { useRef } from 'react'
import { fenceEntries, useScanReveal } from './Stage'

/**
 * ```errorbars — the nine Overall Score error states from the demo, drawn instead of shown as a
 * screenshot so they stay sharp at any width. Three families, one per column: the original
 * gauge reworked (grey card, black label), then the alert pair (red label) on a grey card and
 * on a tinted one, each with a warning badge, a warning triangle, or the bar alone.
 *
 *   title / message: the card's label and the bar's text
 *   caption: shown under the panel, like an image row's alt text
 */

type Bar = 'gauge' | 'striped' | 'flood' | 'triangle' | 'badge' | 'plain'
type Tone = 'muted' | 'alert' | 'tinted'

const FAMILIES: { tone: Tone; bars: Bar[] }[] = [
  { tone: 'muted', bars: ['gauge', 'striped', 'flood'] },
  { tone: 'alert', bars: ['triangle', 'badge', 'plain'] },
  { tone: 'tinted', bars: ['badge', 'triangle', 'plain'] },
]

export function ErrorBars({ content }: { content: string }) {
  const panel = useRef<HTMLDivElement>(null)
  useScanReveal(panel)

  const copy = { title: 'Overall Score', message: 'Error Loading Data', caption: '' }
  for (const [key, value] of fenceEntries(content)) {
    if (key in copy) copy[key as keyof typeof copy] = value
  }

  return (
    <figure className="study-figure proto-errors">
      {/* Unlabelled like an image row's picture: the caption below already says what it is. */}
      <div ref={panel} className="proto-errors-panel" aria-hidden="true">
        {FAMILIES.map(({ tone, bars }) => (
          <div key={tone} className="proto-errors-family">
            {bars.map((bar) =>
              bar === 'flood' ? (
                <div key={bar} className="proto-errors-card proto-errors-card--flood">
                  <span className="proto-errors-text">{copy.message}</span>
                </div>
              ) : (
                <div key={bar} className={`proto-errors-card proto-errors-card--${tone}`}>
                  <span className="proto-errors-title">{copy.title}</span>
                  <span className="proto-errors-row">
                    <span className={`proto-errors-bar proto-errors-bar--${bar}`}>
                      <span className="proto-errors-text">{copy.message}</span>
                    </span>
                    {bar === 'badge' && <span className="proto-errors-badge">!</span>}
                    {bar === 'triangle' && <WarningTriangle />}
                  </span>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
      {copy.caption && <figcaption>{copy.caption}</figcaption>}
    </figure>
  )
}

/** Its left edge runs parallel to the slanted end of the bar it follows. */
function WarningTriangle() {
  return (
    <svg className="proto-errors-triangle" viewBox="0 0 34 30">
      <path d="M17 2.5 L32 28 H2 Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <rect x="15.6" y="11" width="2.8" height="9.5" rx="1.4" fill="#fff" />
      <circle cx="17" cy="24.2" r="1.6" fill="#fff" />
    </svg>
  )
}
