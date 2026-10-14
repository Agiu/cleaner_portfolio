import { useEffect, useId, useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { BookIcon, CheckIcon, CloseIcon, PlaneIcon } from './ForeFlightIcons'
import { fenceEntries, fenceParts, Stage } from './Stage'

/**
 * ```variants — the Logbook Link modal, redrawn once per design pass along a strip you pull:
 * by its handle underneath, or by grabbing the strip itself. Every pass is the same modal with
 * parts switched on, so the fence authors them as a part list. Each card's own "Link Track Log"
 * presses and plays through to the confirmation the last pass shows at rest; × dismisses the
 * card and it comes back.
 *
 *   title / route / blurb / action / confirm: the copy every variant shares
 *   variant: name | parts, comma-separated | what this pass was trying
 *
 * Parts: narrow, plane, book, route, rule, blurb, action, confirm.
 */

/** How long a pressed card holds the confirmation, and how long a dismissed one stays gone. */
const CONFIRM_MS = 2000
const DISMISS_MS = 900

const PARTS = ['narrow', 'plane', 'book', 'route', 'rule', 'blurb', 'action', 'confirm'] as const
type Part = (typeof PARTS)[number]
type Variant = { name: string; parts: Set<Part>; note: string }
type CardState = 'idle' | 'confirming' | 'dismissed'

function parseVariants(content: string) {
  const copy = { title: 'Logbook Link', route: '', blurb: '', action: 'Link Track Log', confirm: '' }
  const variants: Variant[] = []

  for (const [key, value] of fenceEntries(content)) {
    if (key === 'variant') {
      const [name = '', parts = '', note = ''] = fenceParts(value)
      if (!name) continue
      const list = parts.split(',').map((p) => p.trim().toLowerCase())
      variants.push({ name, parts: new Set(list.filter((p): p is Part => (PARTS as readonly string[]).includes(p))), note })
    } else if (key in copy) {
      copy[key as keyof typeof copy] = value
    }
  }
  return { copy, variants }
}

export function VariantStrip({ content }: { content: string }) {
  const { copy, variants } = parseVariants(content)
  const strip = useRef<HTMLUListElement>(null)
  const timers = useRef(new Map<number, number>())
  const stripId = useId()
  const [states, setStates] = useState<Record<number, CardState>>({})
  // The handle, as fractions of its track: how much of the strip is in view, and how far along.
  // Null while everything fits, when there's nothing to pull.
  const [thumb, setThumb] = useState<{ size: number; offset: number } | null>(null)

  useEffect(() => {
    const el = strip.current
    if (!el) return
    const update = () => {
      const { scrollWidth, clientWidth, scrollLeft } = el
      setThumb(scrollWidth - clientWidth < 1 ? null : { size: clientWidth / scrollWidth, offset: scrollLeft / scrollWidth })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [variants.length])

  // Grab-and-pull the strip itself with a mouse (touch already scrolls it natively). A pull
  // that moved isn't a press, so the click it ends in is swallowed before a card sees it.
  useEffect(() => {
    const el = strip.current
    if (!el) return
    let start: { x: number; left: number } | null = null
    let pulled = false

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      start = { x: e.clientX, left: el.scrollLeft }
      pulled = false
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      if (!pulled && Math.abs(dx) < 5) return
      if (!pulled) {
        pulled = true
        el.setPointerCapture(e.pointerId)
        el.dataset.pulling = ''
      }
      el.scrollLeft = start.left - dx
    }
    const up = () => {
      start = null
      delete el.dataset.pulling
    }
    const click = (e: MouseEvent) => {
      if (!pulled) return
      e.preventDefault()
      e.stopPropagation()
      pulled = false
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true)
    }
  }, [])

  useEffect(() => {
    const running = timers.current
    return () => running.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          gsap.utils.toArray(strip.current!.children),
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: strip.current, start: 'top 85%', once: true } },
        )
      })
    },
    { scope: strip },
  )

  if (!variants.length) return null

  // Every state a card enters goes back to idle on its own, so nobody returns to a board of
  // dismissed cards. One timer per card, replaced if it's pressed again mid-hold.
  const flash = (i: number, state: CardState, ms: number) => {
    window.clearTimeout(timers.current.get(i))
    setStates((s) => ({ ...s, [i]: state }))
    timers.current.set(
      i,
      window.setTimeout(() => {
        timers.current.delete(i)
        setStates((s) => ({ ...s, [i]: 'idle' }))
      }, ms),
    )
  }

  /** The handle: grabbed, it keeps hold where it was grabbed; pressing the track centres it under the pointer. */
  const pull = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = strip.current
    if (!el || !thumb || e.button !== 0) return
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const thumbW = thumb.size * rect.width
    const thumbX = thumb.offset * rect.width
    const x = e.clientX - rect.left
    const grab = x >= thumbX && x <= thumbX + thumbW ? x - thumbX : thumbW / 2

    const to = (clientX: number) => {
      const p = (clientX - rect.left - grab) / (rect.width - thumbW)
      el.scrollLeft = Math.min(1, Math.max(0, p)) * (el.scrollWidth - el.clientWidth)
    }
    const move = (ev: PointerEvent) => to(ev.clientX)
    const up = () => {
      delete bar.dataset.pulling
      bar.removeEventListener('pointermove', move)
      bar.removeEventListener('pointerup', up)
      bar.removeEventListener('pointercancel', up)
    }

    e.preventDefault()
    bar.setPointerCapture(e.pointerId)
    bar.dataset.pulling = ''
    to(e.clientX)
    bar.addEventListener('pointermove', move)
    bar.addEventListener('pointerup', up)
    bar.addEventListener('pointercancel', up)
  }

  // Arrow keys step one card's width; Home / End run to either end.
  const nudge = (e: React.KeyboardEvent) => {
    const el = strip.current
    const step = (el?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0
    if (!el) return
    const left = { ArrowLeft: el.scrollLeft - step, ArrowRight: el.scrollLeft + step, Home: 0, End: el.scrollWidth }[e.key]
    if (left === undefined) return
    e.preventDefault()
    el.scrollTo({ left, behavior: 'smooth' })
  }

  return (
    <Stage className="proto-variants">
      <ul ref={strip} id={stripId} className="proto-variants-strip" data-lenis-prevent-horizontal>
        {variants.map((variant, i) => {
          // A variant authored as `confirm` *is* the confirmation: nothing to return to.
          const fixed = variant.parts.has('confirm')
          const state = fixed ? 'confirming' : states[i] ?? 'idle'

          return (
            <li key={`${variant.name}-${i}`} className="proto-variant">
              <p className="proto-variant-label">
                <span className="proto-variant-index">{String(i + 1).padStart(2, '0')}</span>
                {variant.name}
              </p>

              <div className="ff-card" data-state={state} data-narrow={variant.parts.has('narrow') || undefined}>
                <div className="ff-card-bar">
                  <span className="ff-card-title">{copy.title}</span>
                  <button
                    type="button"
                    className="ff-card-close"
                    onClick={() => !fixed && flash(i, 'dismissed', DISMISS_MS)}
                    disabled={fixed}
                    aria-label={`Dismiss the ${variant.name} modal`}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="ff-card-body">
                  {state === 'confirming' ? (
                    <>
                      <span className="ff-card-confirm">
                        <CheckIcon />
                      </span>
                      <p className="ff-card-confirm-note">{copy.confirm}</p>
                    </>
                  ) : (
                    <>
                      {(variant.parts.has('plane') || variant.parts.has('book')) && (
                        <p className="ff-card-glyphs" aria-hidden="true">
                          <PlaneIcon />
                          {variant.parts.has('book') && (
                            <>
                              <span className="ff-card-plus">+</span>
                              <BookIcon />
                            </>
                          )}
                        </p>
                      )}
                      {variant.parts.has('route') && <p className="ff-card-route">{copy.route}</p>}
                      {variant.parts.has('rule') && <span className="ff-card-rule" aria-hidden="true" />}
                      {variant.parts.has('blurb') && <p className="ff-card-blurb">{copy.blurb}</p>}
                      {variant.parts.has('action') && (
                        <button type="button" className="ff-card-action" onClick={() => flash(i, 'confirming', CONFIRM_MS)}>
                          {copy.action}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {variant.note && <p className="proto-variant-note">{variant.note}</p>}
            </li>
          )
        })}
      </ul>

      {thumb && (
        <div className="proto-puller">
          <span aria-hidden="true">01</span>
          <div
            className="proto-puller-track"
            role="scrollbar"
            aria-controls={stripId}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((thumb.offset / (1 - thumb.size)) * 100)}
            aria-label="Pull through the variants"
            tabIndex={0}
            onPointerDown={pull}
            onKeyDown={nudge}
          >
            <span className="proto-puller-thumb" style={{ left: `${thumb.offset * 100}%`, width: `${thumb.size * 100}%` }} />
          </div>
          <span aria-hidden="true">{String(variants.length).padStart(2, '0')}</span>
        </div>
      )}
    </Stage>
  )
}
