import { useEffect, useRef, useState } from 'react'
import { CheckGlyph, CloseGlyph } from './ForeFlightIcons'
import { parseLogbook } from './LogbookPicker'

/**
 * The first pass at the logbook dialog, kept so LogbookCompare can show the interaction change
 * rather than assert it. It reads the same fence as LogbookPicker and draws it the old way:
 * a checkbox per row (one at a time), a primary "Add to Logbook Entry" that stays disabled until
 * something is ticked — the second press the final design removed — and "Show More" instead of
 * a scrolling list. Recommended rows and the `linked` flag are ignored: neither existed yet.
 */

const CONFIRM_MS = 2600
const DISMISS_MS = 900
/** Rows shown before "Show More", as this pass drew it. */
const VISIBLE = 4

type Phase = 'idle' | 'confirming' | 'dismissed'

export function LogbookPickerBefore({ content }: { content: string }) {
  const { copy, entries } = parseLogbook(content)
  const [phase, setPhase] = useState<Phase>('idle')
  const [picked, setPicked] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [outcome, setOutcome] = useState<{ headline: string; note: string } | null>(null)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!entries.length) return null

  const flash = (next: Phase, ms: number) => {
    window.clearTimeout(timer.current)
    setPhase(next)
    timer.current = window.setTimeout(() => {
      setPhase('idle')
      setOutcome(null)
    }, ms)
  }

  const add = () => {
    if (picked === null) return
    setOutcome({ headline: `${entries[picked].route} linked`, note: copy.confirm })
    flash('confirming', CONFIRM_MS)
  }

  const create = () => {
    setOutcome({ headline: copy.confirmNew, note: copy.confirm })
    flash('confirming', CONFIRM_MS)
  }

  const shown = expanded ? entries : entries.slice(0, VISIBLE)

  return (
    <div className="ff-logbook" data-state={phase}>
      <div className="ff-logbook-bar">
        <span className="ff-logbook-title">{copy.title}</span>
        <button type="button" className="ff-logbook-close" onClick={() => flash('dismissed', DISMISS_MS)} aria-label={`Dismiss the ${copy.title} dialog`}>
          <CloseGlyph />
        </button>
      </div>

      <div className="ff-logbook-body">
        <p className="ff-logbook-heading">{copy.heading}</p>
        {copy.blurb && <p className="ff-logbook-blurb">{copy.blurb}</p>}

        {phase === 'confirming' && outcome ? (
          <div className="ff-logbook-done" role="status">
            <span className="ff-logbook-done-mark" aria-hidden="true">
              <CheckGlyph />
            </span>
            {outcome.headline && <p className="ff-logbook-done-headline">{outcome.headline}</p>}
            {outcome.note && <p className="ff-logbook-done-note">{outcome.note}</p>}
          </div>
        ) : (
          <>
            {copy.group && <p className="ff-logbook-group ff-logbook-group--spaced">{copy.group}</p>}
            <ul data-active={picked !== null || undefined}>
              {shown.map((entry, i) => (
                <li key={`${entry.route}-${i}`} className="ff-logbook-row" data-picked={picked === i || undefined}>
                  <label className="ff-logbook-pick">
                    <input
                      type="checkbox"
                      className="ff-logbook-check"
                      checked={picked === i}
                      onChange={() => setPicked((p) => (p === i ? null : i))}
                    />
                    <span className="ff-logbook-what">
                      <span className="ff-logbook-route">{entry.route}</span>
                      {entry.tail && <span className="ff-logbook-tail">{entry.tail}</span>}
                    </span>
                    <span className="ff-logbook-when">
                      {entry.date && <span className="ff-logbook-date">{entry.date}</span>}
                      {entry.total && <span className="ff-logbook-total">{entry.total}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            {entries.length > VISIBLE && (
              <button type="button" className="ff-logbook-more" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
                {expanded ? 'Show Less' : 'Show More'}
              </button>
            )}
            <button type="button" className="ff-logbook-primary" onClick={add} disabled={picked === null}>
              Add to Logbook Entry
            </button>
            <button type="button" className="ff-logbook-secondary" onClick={create}>
              {copy.secondary}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
