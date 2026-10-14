import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { CloseGlyph, PlusGlyph, UnlinkGlyph } from './ForeFlightIcons'
import { fenceEntries, fenceParts, Stage } from './Stage'

// React 18's types predate `inert`; it's passed through as "" (on) or left off.
declare module 'react' {
  interface HTMLAttributes<T> {
    inert?: '' | undefined
  }
}

/**
 * ```logbook — the final design, in ForeFlight's web system. The track log is already chosen
 * before the dialog opens, so each row carries its own action, in one circle on the left:
 *
 *   - a grey plus on any entry this track log can link to; pressing it *is* the link;
 *   - a broken chain on a light red circle on an entry that's already linked, visible at rest
 *     (not revealed by hover, which a touchscreen never sees). Hover deepens it to full red;
 *     pressing it unlinks, so a mistaken link is one press to undo.
 *
 * The change happens in place: the plus turns into the chain, the row grows, and a "Linked"
 * tag slides into the space (all reversed on unlink).
 *
 * Recent and Recommended share one scrolling list (scrolling is what reveals Recommended), with
 * each group's label sticking to the top while its rows pass under it. "Create New Entry" builds
 * a row from this track log's own data at the top of Recent in two beats: it opens in with a plus
 * and "Just created", then links as the tag flips to "Linked".
 *
 * Pressing a row anywhere but its circle selects it, and two actions open under "Create New
 * Entry": Delete collapses the row out of the list, Visit plays the hand-off to the logbook.
 * Pressing the row again, or the card's white outside the rows and actions, deselects.
 *
 * `bare` drops the stage so LogbookCompare can put two dialogs on one.
 */

const DISMISS_MS = 900
/** How long a row takes to open or collapse; matches the 0.4s CSS transitions it runs on. */
const ENTER_MS = 400
/** Floor on the drawn scrollbar thumb, so a long list still leaves something to grab. */
const MIN_THUMB = 0.16

let createdCount = 0

export type Entry = {
  route: string
  tail: string
  date: string
  total: string
  connected: boolean
  /** Only on rows "Create New Entry" adds: a key that doesn't depend on list position. */
  id?: string
}

/**
 * Scalar copy as `key: value` (title, heading, blurb, group, recommended-group, connected-note,
 * created-note, secondary, remove, open, opening, confirm, confirm-new), plus rows shaped
 * `route | tail | date | total | [linked]`:
 *
 *   entry:       a recent entry          recommended: an entry in the group revealed by scrolling
 *   new-entry:   this track log's own row, which "Create New Entry" adds
 */
export function parseLogbook(content: string) {
  const copy = {
    title: 'Add to Logbook',
    heading: 'Select a Logbook entry',
    blurb: '',
    group: 'Recent Entries',
    recommendedGroup: 'Recommended Entries',
    connectedNote: 'Linked',
    createdNote: 'Just created',
    secondary: 'Create New Entry',
    remove: 'Delete',
    open: 'Visit',
    opening: 'Opening…',
    confirm: '',
    confirmNew: '',
  }
  const entries: Entry[] = []
  const recommended: Entry[] = []
  let newEntry: Entry | null = null

  const row = (value: string): Entry | null => {
    const [route = '', tail = '', date = '', total = '', flag = ''] = fenceParts(value)
    return route ? { route, tail, date, total, connected: flag.toLowerCase() === 'linked' } : null
  }
  // kebab-case keys in the fence, camelCase in the copy object.
  const camel = (key: string) => key.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())

  for (const [key, value] of fenceEntries(content)) {
    if (key === 'entry') {
      const r = row(value)
      if (r) entries.push(r)
    } else if (key === 'recommended') {
      const r = row(value)
      if (r) recommended.push(r)
    } else if (key === 'new-entry') newEntry = row(value)
    else if (camel(key) in copy) copy[camel(key) as keyof typeof copy] = value
  }
  return { copy, entries, recommended, newEntry }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function LogbookPicker({ content, bare = false }: { content: string; bare?: boolean }) {
  const { copy, entries, recommended, newEntry } = parseLogbook(content)
  const [dismissed, setDismissed] = useState(false)
  // Per-row overrides of the fence's `linked` flag; link and unlink are the same write.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  // Rows "Create New Entry" has added this visit, newest first.
  const [created, setCreated] = useState<Entry[]>([])
  // A created row's entrance, by id: "collapsed" for the frame it mounts at zero height, "open"
  // while it grows in still showing the plus. Dropping out of here is what links it.
  const [entering, setEntering] = useState<Record<string, 'collapsed' | 'open'>>({})
  // The row a press on its body selected, for Delete / Visit to act on.
  const [selected, setSelected] = useState<string | null>(null)
  // Rows Delete took out: `leaving` while they collapse, `deleted` once they're gone.
  const [leaving, setLeaving] = useState<Record<string, true>>({})
  const [deleted, setDeleted] = useState<Record<string, true>>({})
  const [opening, setOpening] = useState(false)
  // The drawn scrollbar as fractions of the list's height, and whether any of it is below the fold.
  const [thumb, setThumb] = useState<{ size: number; offset: number; more: boolean } | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dismissTimer = useRef<number>()
  // Every frame and timeout the row animations schedule, cleared if the dialog unmounts mid-way.
  const motion = useRef(new Set<number>())

  useEffect(() => {
    const pending = motion.current
    return () => {
      window.clearTimeout(dismissTimer.current)
      pending.forEach((id) => {
        window.clearTimeout(id)
        window.cancelAnimationFrame(id)
      })
    }
  }, [])

  // Read from the list itself, and from each group too: rows growing in and collapsing out
  // change how much is below the fold over a whole animation, not only when a row is added.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => {
      const { scrollHeight, clientHeight, scrollTop } = el
      setThumb(
        scrollHeight - clientHeight < 1
          ? null
          : {
              size: Math.max(MIN_THUMB, clientHeight / scrollHeight),
              offset: scrollTop / scrollHeight,
              more: scrollTop + clientHeight < scrollHeight - 1,
            },
      )
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const group of el.children) observer.observe(group)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [entries.length, recommended.length, created.length, deleted])

  if (!entries.length && !recommended.length) return null

  const after = (ms: number, run: () => void) => {
    const id = window.setTimeout(() => {
      motion.current.delete(id)
      run()
    }, ms)
    motion.current.add(id)
  }

  // Dismissed comes back on its own, so the card is never left hidden.
  const dismiss = () => {
    window.clearTimeout(dismissTimer.current)
    setDismissed(true)
    dismissTimer.current = window.setTimeout(() => setDismissed(false), DISMISS_MS)
  }

  const select = (key: string) => setSelected((current) => (current === key ? null : key))

  // A press anywhere on the card's white that isn't a row or an action deselects, like clicking
  // off a selection anywhere else.
  const deselectOutside = (e: MouseEvent) => {
    if (!(e.target as Element).closest('[data-keeps-selection]')) setSelected(null)
  }

  // No confirm step: the row collapsing out of the list (a created row's entrance, backwards) is it.
  const remove = () => {
    if (!selected) return
    const key = selected
    setSelected(null)
    const drop = () => setDeleted((d) => ({ ...d, [key]: true }))
    if (reducedMotion()) return drop()
    setLeaving((l) => ({ ...l, [key]: true }))
    after(ENTER_MS, drop)
  }

  // There's no logbook to go to from a case study, so the hand-off is played: the label flips to
  // "Opening…", then the card steps back the way × dismisses it and returns with nothing selected.
  const open = () => {
    if (!selected || opening) return
    setOpening(true)
    after(ENTER_MS * 2, () => {
      setOpening(false)
      setSelected(null)
      dismiss()
    })
  }

  const create = () => {
    if (!newEntry) return
    const id = `created-${++createdCount}`
    setCreated((rows) => [{ ...newEntry, connected: true, id }, ...rows])
    // It lands at the top of the list, which may be scrolled away: bring it back into view.
    scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    if (reducedMotion()) return

    // Mounted collapsed; opened two frames later (one to commit the collapsed style, one to
    // transition away from it); linked once it's fully open.
    const phase = (p: 'collapsed' | 'open' | null) =>
      setEntering((current) => {
        const next = { ...current }
        if (p) next[id] = p
        else delete next[id]
        return next
      })
    const frame = (run: () => void) => motion.current.add(window.requestAnimationFrame(run))
    phase('collapsed')
    frame(() =>
      frame(() => {
        phase('open')
        after(ENTER_MS, () => phase(null))
      }),
    )
  }

  const rowKey = (label: string, e: Entry) => e.id ?? `${label}-${e.route}-${e.tail}-${e.date}-${e.total}`

  const rows = (label: string, all: Entry[]) => {
    const list = all.filter((entry) => !deleted[rowKey(label, entry)])
    return (
      list.length > 0 && (
        <div className="ff-logbook-group-block">
          <p className="ff-logbook-group">{label}</p>
          <ul>
            {list.map((entry) => {
              const key = rowKey(label, entry)
              const phase = entry.id ? entering[entry.id] : undefined
              // A created row shows as unlinked until it's fully in.
              const linked = !phase && (overrides[key] ?? entry.connected)
              return (
                <li
                  key={key}
                  className="ff-logbook-row"
                  data-collapsed={phase === 'collapsed' || leaving[key] || undefined}
                  inert={leaving[key] ? '' : undefined}
                >
                  <div className="ff-logbook-row-clip">
                    <div className="ff-logbook-pick" data-selected={selected === key || undefined} data-keeps-selection>
                      <button
                        type="button"
                        className="ff-logbook-row-action"
                        data-variant={linked ? 'connected' : 'link'}
                        onClick={() => setOverrides((o) => ({ ...o, [key]: !linked }))}
                        aria-label={linked ? `Unlink this track log from ${entry.route}` : `Link this track log to ${entry.route}`}
                      >
                        <span className="ff-logbook-icon-plus" aria-hidden="true">
                          <PlusGlyph />
                        </span>
                        <span className="ff-logbook-icon-unlink" aria-hidden="true">
                          <UnlinkGlyph />
                        </span>
                      </button>

                      <span className="ff-logbook-what">
                        {/* The row's select target: its ::after stretches over the whole row,
                            under the circle, so a press anywhere but the circle selects. */}
                        <button
                          type="button"
                          className="ff-logbook-select"
                          onClick={() => select(key)}
                          aria-pressed={selected === key}
                          aria-label={`${entry.route}, ${entry.date}`}
                        >
                          <span className="ff-logbook-route">{entry.route}</span>
                        </button>
                        {entry.tail && <span className="ff-logbook-tail">{entry.tail}</span>}
                        <span className="ff-logbook-tag-reveal" data-open={linked || phase ? true : undefined} aria-hidden={!linked}>
                          <span className="ff-logbook-tag-clip">
                            <span className="ff-logbook-tag" data-label={phase ? 'created' : 'linked'}>
                              {entry.id && <span className="ff-logbook-tag-created">{copy.createdNote}</span>}
                              <span className="ff-logbook-tag-linked">{copy.connectedNote}</span>
                            </span>
                          </span>
                        </span>
                      </span>

                      <span className="ff-logbook-when">
                        {entry.date && <span className="ff-logbook-date">{entry.date}</span>}
                        {entry.total && <span className="ff-logbook-total">{entry.total}</span>}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )
    )
  }

  const modal = (
    <div className="ff-logbook" data-state={dismissed ? 'dismissed' : 'idle'} onClick={deselectOutside}>
      <div className="ff-logbook-bar">
        <span className="ff-logbook-title">{copy.title}</span>
        <button type="button" className="ff-logbook-close" onClick={dismiss} aria-label={`Dismiss the ${copy.title} dialog`}>
          <CloseGlyph />
        </button>
      </div>
      <div className="ff-logbook-body">
        <p className="ff-logbook-heading">{copy.heading}</p>
        {copy.blurb && <p className="ff-logbook-blurb">{copy.blurb}</p>}
        <div className="ff-logbook-scroll-wrap">
          <div className="ff-logbook-scroll" ref={scrollerRef} data-lenis-prevent>
            {rows(copy.group, [...created, ...entries])}
            {rows(copy.recommendedGroup, recommended)}
          </div>
          {/* The "more below" shade; fades out once the list is scrolled to its end. */}
          <span className="ff-logbook-fade" data-visible={thumb?.more || undefined} aria-hidden="true" />
          {thumb && (
            <span className="ff-logbook-track" aria-hidden="true">
              <span className="ff-logbook-thumb" style={{ height: `${thumb.size * 100}%`, top: `${thumb.offset * 100}%` }} />
            </span>
          )}
        </div>
        <button type="button" className="ff-logbook-secondary" onClick={create} disabled={!newEntry}>
          {copy.secondary}
        </button>
        {/* The rows' own reveal, one level down: selecting a row opens a space under
            "Create New Entry" and its actions slide down into it. */}
        <div className="ff-logbook-actions-reveal" data-open={selected ? true : undefined} inert={selected ? undefined : ''}>
          <div className="ff-logbook-actions-clip">
            <div className="ff-logbook-actions" data-keeps-selection>
              <button type="button" className="ff-logbook-delete" onClick={remove}>
                {copy.remove}
              </button>
              <button type="button" className="ff-logbook-open" onClick={open} data-label={opening ? 'opening' : 'open'} aria-live="polite">
                <span className="ff-logbook-open-idle" aria-hidden={opening}>
                  {copy.open}
                </span>
                <span className="ff-logbook-open-busy" aria-hidden={!opening}>
                  {copy.opening}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return bare ? modal : <Stage>{modal}</Stage>
}
