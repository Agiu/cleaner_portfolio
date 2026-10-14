import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { Stage } from './Stage'

/**
 * ```flow — the track log → logbook link, played rather than listed. The track logs sit on one
 * side, the logbook entry on the other, and every recorded field crosses the gap until the entry
 * is full. Five beats, captioned underneath:
 *
 *   1. the kebab on a track log row opens;
 *   2. "Link Logbook" is pressed — one press, which is the point;
 *   3. there's no entry yet, so one is created;
 *   4. every recorded field crosses over and lands on its row of the entry;
 *   5. the second leg sends too, and the entry resolves to one consolidated flight.
 *
 * Fence lines, `kind: parts | separated | by pipes`:
 *
 *   step:  title | note
 *   leg:   route | meta
 *   field: label | value | which leg it came from (1, 2 or both)
 *   entry: the title the logbook entry resolves to
 *
 * Without motion (reduced motion, or before the script runs) the markup is the finished state:
 * entry filled, both legs linked. `data-anim="pending"` on the root winds it back to the empty
 * state while the timeline plays it forward; "done" comes off the last tween.
 */

/** Beat marks, in seconds from the start. */
const T = { arrive: 0, menu: 0.76, press: 1.42, create: 2.06, send: 2.56 }

/* One field leaves every CHIP_GAP and is in the air for CHIP_TRAVEL, so several cross at once:
   it reads as a recording being poured across rather than a queue being worked. */
const CHIP_GAP = 0.3
const CHIP_TRAVEL = 0.52

/** Departure points fanned across the log card, so two fields in the air read as two. */
const CHIP_FAN = 11

/** Where the pointer starts, relative to the control it reaches for. */
const CURSOR_APPROACH = 30

/** Items either side of the one that matters, so the press reads as a press of *this* item. */
const MENU = ['Duplicate', 'Link Logbook', 'Export CSV', 'Delete']
const MENU_TARGET = 1

type Leg = { route: string; meta: string }
type Field = { label: string; value: string; from: number[] }
type Step = { title: string; note: string }

const FALLBACK = {
  steps: [
    { title: 'Open the kebab', note: 'On any track log row' },
    { title: 'Press “Link Logbook”', note: 'One press, no matching screen' },
    { title: 'No entry yet? One is created', note: '' },
    { title: 'Telemetry crosses over', note: 'Every recorded field' },
    { title: 'Legs consolidate', note: 'Two track logs, one entry' },
  ] as Step[],
  legs: [
    { route: 'Leg 1', meta: 'Track log' },
    { route: 'Leg 2', meta: 'Track log' },
  ] as Leg[],
  fields: [
    { label: 'Telemetry', value: 'recorded', from: [0] },
    { label: 'Distance', value: 'recorded', from: [1] },
  ] as Field[],
  entry: 'Logbook entry',
}

/** A bare line is a step, so a plain bullet list pasted into the fence still captions the flow. */
function parseFlow(content: string) {
  const steps: Step[] = []
  const legs: Leg[] = []
  const fields: Field[] = []
  let entry = ''

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const match = line.match(/^(step|leg|field|entry)\s*:\s*(.*)$/i)
    const kind = match ? match[1].toLowerCase() : 'step'
    const parts = (match ? match[2] : line).split('|').map((part) => part.trim())

    if (kind === 'entry') entry = parts[0]
    else if (kind === 'leg') legs.push({ route: parts[0], meta: parts[1] ?? '' })
    else if (kind === 'field') {
      // "both" is a field reconciled across legs (total time): one chip leaves each.
      const source = (parts[2] ?? '1').toLowerCase()
      const leg = Math.max(0, (Number(source) || 1) - 1)
      fields.push({ label: parts[0], value: parts[1] ?? '', from: source === 'both' ? [0, 1] : [leg] })
    } else steps.push({ title: parts[0], note: parts[1] ?? '' })
  }

  const resolvedLegs = legs.length ? legs : FALLBACK.legs
  return {
    steps: steps.length ? steps : FALLBACK.steps,
    legs: resolvedLegs,
    // A field can't be sent from a leg that isn't there.
    fields: (fields.length ? fields : FALLBACK.fields).map((f) => ({ ...f, from: f.from.filter((leg) => leg < resolvedLegs.length) })),
    entry: entry || FALLBACK.entry,
  }
}

export function LinkFlow({ content }: { content: string }) {
  const { steps, legs, fields, entry } = parseFlow(content)
  const root = useRef<HTMLDivElement>(null)
  const replay = useRef<(() => void) | null>(null)

  // One chip per (field, source leg) pair; each carries the row it fills and the leg it left.
  const sends = fields.flatMap((field, row) => field.from.map((leg) => ({ field, row, leg })))

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const el = root.current!
        let running: gsap.core.Timeline | null = null

        const play = () => {
          running?.kill()
          reset(el)
          running = build(el, steps.length)
        }
        replay.current = play

        el.dataset.anim = 'pending'
        const trigger = ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: play })

        return () => {
          trigger.kill()
          running?.kill()
          reset(el)
          delete el.dataset.anim
          replay.current = null
        }
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="proto-flow">
      <Stage className="proto-flow-stage">
        <div className="proto-flow-board" data-board>
          {/* Source: the track logs, as the web app lists them. */}
          <div className="proto-flow-side">
            <p className="proto-flow-label" data-row>
              Track logs
            </p>
            {legs.map((leg, i) => (
              <div key={i} className="proto-flow-log" data-row data-leg={i}>
                <span className="proto-flow-route">{leg.route}</span>
                <span className="proto-flow-meta">{leg.meta}</span>
                <span className="proto-flow-linked" data-value>
                  Linked
                </span>
                {/* Only the first row carries the menu: the flow is one row's kebab. */}
                {i === 0 && (
                  <>
                    <span className="proto-flow-kebab" data-kebab aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="proto-flow-menu" data-menu aria-hidden="true">
                      {MENU.map((item, m) => (
                        <span key={item} className="proto-flow-menu-item" data-menu-item={m === MENU_TARGET ? 'link' : undefined}>
                          {item}
                        </span>
                      ))}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* The gap the data crosses. */}
          <div className="proto-flow-wire" data-row aria-hidden="true">
            <span className="proto-flow-wire-line" />
          </div>

          {/* Target: the logbook entry, filled by what arrives. */}
          <div className="proto-flow-side">
            <p className="proto-flow-label" data-row>
              Logbook entry
            </p>
            <div className="proto-flow-entry" data-row data-entry>
              <span className="proto-flow-entry-title" data-value data-entry-title>
                {entry}
              </span>
              <span className="proto-flow-entry-ghost" data-ghost aria-hidden="true">
                Untitled entry
              </span>
              <dl className="proto-flow-rows">
                {fields.map((field, i) => (
                  <div key={i} className="proto-flow-row" data-field-row={i}>
                    <dt className="proto-flow-row-label">{field.label}</dt>
                    <dd className="proto-flow-row-value" data-value data-field-value={i}>
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="proto-flow-entry-foot" data-value data-entry-foot>
                {legs.length} track logs linked · {fields.length} fields filled from telemetry
              </p>
              {/* Before beat 3 there's nothing to link to: laid over the finished entry until it's created. */}
              <span className="proto-flow-empty" data-empty aria-hidden="true">
                No logbook entry — one is created for you
              </span>
            </div>
          </div>

          {/* Chips and pointer belong to the board, not to either column: they travel between them. */}
          {sends.map((send, i) => (
            <span key={i} className="proto-flow-chip" data-chip data-chip-row={send.row} data-chip-leg={send.leg} aria-hidden="true">
              <b>{send.field.label}</b>
              {send.field.value}
            </span>
          ))}
          <svg className="proto-flow-cursor" data-cursor viewBox="0 0 14 19" aria-hidden="true">
            <path d="M1 1v15l4-3.6 2.8 6 2.3-1-2.7-5.9H13z" />
          </svg>
        </div>

        {/* Captions on the board's own column, so they stay under it however wide the page runs. */}
        <div className="proto-flow-captions">
          <ol className="proto-flow-steps">
            {steps.map((step, i) => (
              <li key={i} className="proto-flow-step" data-step={i} data-row>
                <span className="proto-flow-step-title">{step.title}</span>
                {step.note && <span className="proto-flow-step-note">{step.note}</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="proto-flow-replay" onClick={() => replay.current?.()}>
            Replay the flow
          </button>
        </div>
      </Stage>
    </div>
  )
}

/* ---- choreography ---- */

/** Everything a tween touches, cleared back to the served state. */
function reset(el: HTMLElement) {
  const moved = el.querySelectorAll<HTMLElement>(
    '[data-row],[data-value],[data-chip],[data-cursor],[data-menu],[data-empty],[data-ghost],[data-entry],[data-kebab]',
  )
  gsap.set(moved, { clearProps: 'all' })
  el.querySelectorAll<HTMLElement>('[data-leg]').forEach((n) => delete n.dataset.linked)
  el.querySelectorAll<HTMLElement>('[data-step]').forEach((n) => delete n.dataset.active)
  el.querySelectorAll<HTMLElement>('[data-field-row]').forEach((n) => delete n.dataset.filled)
  const target = el.querySelector<HTMLElement>("[data-menu-item='link']")
  if (target) delete target.dataset.hot
  delete el.dataset.wire
  el.dataset.anim = 'pending'
}

type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number }

function build(el: HTMLElement, stepCount: number) {
  const one = (sel: string) => el.querySelector<HTMLElement>(sel)
  const all = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel))

  // Chips and the pointer are absolutely positioned inside the board: that's their coordinate space.
  const board = one('[data-board]') ?? el

  // Measured with the arrival offset lifted (the "measure" state in the CSS): by the time a chip
  // flies, its row has settled, so aim at where the row will be rather than where it waits.
  el.dataset.anim = 'measure'
  const host = board.getBoundingClientRect()
  const at = (node: Element): Box => {
    const r = node.getBoundingClientRect()
    const x = r.left - host.left
    const y = r.top - host.top
    return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 }
  }

  const rows = all('[data-row]')
  const legCards = all('[data-leg]')
  const stepNodes = all('[data-step]')
  const cursor = one('[data-cursor]')
  const kebab = one('[data-kebab]')
  const menu = one('[data-menu]')
  const menuItem = one("[data-menu-item='link']")
  const empty = one('[data-empty]')
  const ghost = one('[data-ghost]')
  const entryCard = one('[data-entry]')
  const title = one('[data-entry-title]')
  const foot = one('[data-entry-foot]')

  // Every box the timeline needs, in one pass while the layout is settled.
  const kebabBox = kebab ? at(kebab) : null
  const menuBox = menuItem ? at(menuItem) : null
  const flights = all('[data-chip]').flatMap((chip) => {
    const row = Number(chip.dataset.chipRow ?? 0)
    const leg = Number(chip.dataset.chipLeg ?? 0)
    const from = legCards[leg]
    const to = one(`[data-field-value="${row}"]`)
    if (!from || !to) return []
    return [{ chip, to, row, leg, start: T.send + row * CHIP_GAP, src: at(from), dst: at(to), w: chip.offsetWidth, h: chip.offsetHeight }]
  })
  el.dataset.anim = 'pending'

  /** Light the step whose beat we're on, and only that one. */
  const step = (i: number) => {
    const index = Math.min(i, stepCount - 1)
    stepNodes.forEach((node) => {
      if (Number(node.dataset.step) === index) node.dataset.active = 'true'
      else delete node.dataset.active
    })
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power4.out' },
    onComplete: () => {
      el.dataset.anim = 'done'
      delete el.dataset.wire
    },
  })

  // 1 — the board arrives.
  tl.fromTo(rows, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.56, stagger: 0.06 }, T.arrive)

  // 2 — the kebab. The pointer comes in from below-right, like a hand reaching for a control.
  if (cursor && kebab && kebabBox) {
    const k = kebabBox
    tl.fromTo(
      cursor,
      { autoAlpha: 0, x: k.cx + CURSOR_APPROACH, y: k.cy + CURSOR_APPROACH },
      { autoAlpha: 1, x: k.cx, y: k.cy, duration: 0.46 },
      T.menu - 0.46,
    )
    tl.call(() => step(0), [], T.menu - 0.46)
    tl.to(cursor, { scale: 0.8, duration: 0.11 }, T.menu)
    tl.to(cursor, { scale: 1, duration: 0.2 }, T.menu + 0.11)
    tl.fromTo(kebab, { opacity: 0.55 }, { opacity: 1, duration: 0.16, immediateRender: false }, T.menu)
  }
  if (menu) {
    tl.fromTo(menu, { autoAlpha: 0, y: -6, scaleY: 0.9 }, { autoAlpha: 1, y: 0, scaleY: 1, duration: 0.3 }, T.menu + 0.09)
  }

  // 3 — the press. This is the whole feature, so nothing else moves during it.
  if (cursor && menuItem && menuBox) {
    tl.to(cursor, { x: menuBox.cx, y: menuBox.cy, duration: 0.43 }, T.press - 0.47)
    tl.call(
      () => {
        menuItem.dataset.hot = 'true'
        step(1)
      },
      [],
      T.press - 0.2,
    )
    tl.to(cursor, { scale: 0.8, duration: 0.11 }, T.press)
    tl.to(cursor, { scale: 1, duration: 0.2 }, T.press + 0.11)
  }
  if (menu) tl.to(menu, { autoAlpha: 0, y: -4, duration: 0.24 }, T.press + 0.22)
  if (cursor) tl.to(cursor, { autoAlpha: 0, duration: 0.26 }, T.press + 0.34)

  // 4 — nothing to link to, so an entry is made: the empty card lifts off the shell under it.
  if (empty) tl.fromTo(empty, { opacity: 1 }, { opacity: 0, duration: 0.4, immediateRender: false }, T.create)
  if (entryCard) tl.fromTo(entryCard, { scale: 0.985 }, { scale: 1, duration: 0.56, immediateRender: false }, T.create)
  tl.call(
    () => {
      step(2)
      el.dataset.wire = 'flowing'
    },
    [],
    T.create,
  )

  // 5 — the crossing. Each chip flies from its leg to the row it fills, and the value appears
  //     only as it lands, so the entry fills at exactly the rate the data arrives. Both ends are
  //     held inside the board, which clips: on the stacked layout the log card runs full width.
  const departure = new Map<number, number>()
  flights.forEach(({ chip, to, row, leg, start, src, dst, w, h }) => {
    const startX = Math.min(src.x + src.w - 20, host.width - w - 8)
    const startY = src.cy + ((row % 3) - 1) * CHIP_FAN
    const endX = Math.max(8, dst.x - w - 8)
    const endY = dst.cy

    gsap.set(chip, { left: startX, top: startY - h / 2 })
    tl.fromTo(
      chip,
      { opacity: 0, x: 0, y: 0 },
      { opacity: 1, x: endX - startX, y: endY - startY, duration: CHIP_TRAVEL, ease: 'power3.inOut' },
      start,
    )
    // Out again as it lands, so the value it deposits is what remains.
    tl.to(chip, { opacity: 0, duration: 0.18 }, start + CHIP_TRAVEL - 0.18)
    tl.call(
      () => {
        const rowNode = one(`[data-field-row="${row}"]`)
        if (rowNode) rowNode.dataset.filled = 'true'
        step(3)
      },
      [],
      start + CHIP_TRAVEL - 0.06,
    )
    tl.fromTo(to, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.34 }, start + CHIP_TRAVEL - 0.06)

    const first = departure.get(leg)
    if (first === undefined || start < first) departure.set(leg, start)
  })

  // A leg lights the moment it first sends: the only cue the entry is built from two logs.
  departure.forEach((start, leg) => {
    const card = legCards[leg]
    if (card) tl.call(() => void (card.dataset.linked = 'true'), [], Math.max(0, start - 0.14))
  })

  // 6 — settled: two logs, one flight, and the entry says so in its own head.
  const lastLanding = flights.reduce((max, f) => Math.max(max, f.start), T.send)
  const settle = lastLanding + CHIP_TRAVEL + 0.12
  tl.call(() => step(4), [], settle)
  if (ghost) tl.fromTo(ghost, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, settle)
  if (title) tl.fromTo(title, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.46 }, settle)
  if (foot) tl.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.46 }, settle + 0.14)

  return tl
}
