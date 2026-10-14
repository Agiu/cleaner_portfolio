import { useEffect, useRef, useState } from 'react'
import { BookIcon, CheckIcon, ChevronIcon, CloseIcon, LinkIcon, PlaneIcon } from './ForeFlightIcons'
import { fenceEntries, Stage } from './Stage'

/**
 * ```submenu — the Logbook Link modal's last pass, once it had to answer the question every
 * variant begged: *which* track log? "Link Track Log" opens a picker instead of acting: recent
 * track logs, then a recommended pick, and choosing any resolves to the variants' confirmation.
 *
 * The picker replaces the button (opening on its top edge and growing past the card's bottom),
 * and the button stays in the layout underneath so the card never changes height. The hairline
 * down its right is a real scrollbar, drawn from scrollTop.
 *
 *   title / route / blurb / action / confirm: the modal's copy
 *   recent-label / recommended-label: the two group headers
 *   recent: one line per recent track log      recommended: one line per recommended pick
 */

const CONFIRM_MS = 2200
const DISMISS_MS = 900
/** Floor on the drawn thumb, so a long list still leaves something to grab. */
const MIN_THUMB = 0.14

type Phase = 'idle' | 'open' | 'confirming' | 'dismissed'

function parseSubmenu(content: string) {
  const copy = {
    title: 'Logbook Link',
    route: '',
    blurb: '',
    action: 'Link Track Log',
    confirm: '',
    recentLabel: 'Recent Track Logs',
    recommendedLabel: 'Recommended',
  }
  const recent: string[] = []
  const recommended: string[] = []

  for (const [key, value] of fenceEntries(content)) {
    if (key === 'recent') recent.push(value)
    else if (key === 'recommended') recommended.push(value)
    else if (key === 'recent-label') copy.recentLabel = value
    else if (key === 'recommended-label') copy.recommendedLabel = value
    else if (key in copy) copy[key as keyof typeof copy] = value
  }
  return { copy, recent, recommended }
}

export function LinkSubmenu({ content }: { content: string }) {
  const { copy, recent, recommended } = parseSubmenu(content)
  const [stage, setStage] = useState<Phase>('idle')
  const [thumb, setThumb] = useState<{ size: number; offset: number } | null>(null)
  const actionRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Both temporary stages revert on their own.
  const flash = (next: Phase, ms: number) => {
    window.clearTimeout(timer.current)
    setStage(next)
    timer.current = window.setTimeout(() => setStage('idle'), ms)
  }

  // Like any menu: a press outside or Escape closes it. Focus moves into the list on open (the
  // trigger is hidden under the panel) and back to the trigger on Escape.
  useEffect(() => {
    if (stage !== 'open') return
    actionRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true })

    const onPointerDown = (e: PointerEvent) => {
      if (!actionRef.current?.contains(e.target as Node)) setStage('idle')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setStage('idle')
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [stage])

  // The drawn scrollbar, read from the scroll region so it stays honest if the list grows.
  useEffect(() => {
    const el = scrollerRef.current
    if (stage !== 'open' || !el) return
    const measure = () => {
      const { scrollHeight, clientHeight, scrollTop } = el
      setThumb(scrollHeight - clientHeight < 1 ? null : { size: Math.max(MIN_THUMB, clientHeight / scrollHeight), offset: scrollTop / scrollHeight })
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [stage])

  if (!copy.route) return null

  const pick = () => flash('confirming', CONFIRM_MS)
  const hasPicker = recent.length > 0 || recommended.length > 0
  const open = stage === 'open'

  const group = (label: string, items: string[]) =>
    items.length > 0 && (
      <div className="ff-submenu-group" role="group" aria-label={label}>
        <p className="ff-submenu-group-label">{label}</p>
        <ul>
          {items.map((route, i) => (
            <li key={`${label}-${i}`}>
              <button type="button" role="menuitem" className="ff-submenu-item" onClick={pick}>
                {route}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <Stage className="proto-submenu">
      <div className="ff-card ff-card--submenu" data-state={stage === 'dismissed' ? 'dismissed' : 'idle'}>
        <div className="ff-card-bar">
          <span className="ff-card-title">{copy.title}</span>
          <button type="button" className="ff-card-close" onClick={() => flash('dismissed', DISMISS_MS)} aria-label={`Dismiss the ${copy.title} modal`}>
            <CloseIcon />
          </button>
        </div>

        <div className="ff-card-body">
          <p className="ff-card-glyphs" aria-hidden="true">
            <PlaneIcon />
            <LinkIcon className="ff-submenu-link-icon" />
            <BookIcon />
          </p>
          <p className="ff-card-route">{copy.route}</p>
          <span className="ff-card-rule" aria-hidden="true" />
          <p className="ff-card-blurb">{copy.blurb}</p>

          <div className="ff-submenu-action" ref={actionRef} data-open={open || undefined}>
            {stage === 'confirming' ? (
              <>
                <span className="ff-card-confirm">
                  <CheckIcon />
                </span>
                <p className="ff-card-confirm-note">{copy.confirm}</p>
              </>
            ) : (
              <button
                type="button"
                ref={triggerRef}
                className="ff-card-action"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setStage((s) => (s === 'open' ? 'idle' : 'open'))}
                disabled={!hasPicker}
              >
                {copy.action}
                {hasPicker && <ChevronIcon className="ff-submenu-chevron" data-open={open || undefined} />}
              </button>
            )}

            {open && hasPicker && (
              <div className="ff-submenu-panel" role="menu">
                <div className="ff-submenu-scroll" ref={scrollerRef} data-lenis-prevent>
                  {group(copy.recentLabel, recent)}
                  {group(copy.recommendedLabel, recommended)}
                </div>
                {thumb && (
                  <span className="ff-submenu-track" aria-hidden="true">
                    <span className="ff-submenu-thumb" style={{ height: `${thumb.size * 100}%`, top: `${thumb.offset * 100}%` }} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  )
}
