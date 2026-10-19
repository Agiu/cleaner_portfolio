import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'
import { fenceParts } from './Stage'

/*
 * Horizontal carousels, at the image rows' edges: a strip that scrolls and snaps slide to slide,
 * dragged with the mouse or swiped, stepped with the arrows or the keyboard, with a counter and a
 * progress rule. The slide in front is full strength; the rest step back a little.
 *
 *   ```carousel   one image per line: `url | caption`, or `url | title | caption`
 *   ```personas   the interviewees, one per line: `P1 | Archetype | tags, … | tags, …`
 */

const lines = (content: string) =>
  content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => fenceParts(l))

/** The strip, its arrows and counter; `onActive` hears which slide is in front. */
function Carousel({
  count,
  label,
  className = '',
  children,
  below,
}: {
  count: number
  label: string
  className?: string
  children: (active: number) => ReactNode
  below?: (active: number) => ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)

  const slides = () => Array.from(track.current?.children ?? []) as HTMLElement[]
  const go = useCallback((i: number) => {
    const t = track.current
    const slide = slides()[Math.max(0, Math.min(count - 1, i))]
    if (!t || !slide) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    t.scrollTo({ left: slide.offsetLeft - t.offsetLeft, behavior: reduce ? 'auto' : 'smooth' })
  }, [count])

  // Every frame the strip moves, each slide's --focus (1 in front, 0 a slide or more away) and
  // the progress rule follow its scroll position exactly, so nothing eases on after it stops.
  // A slide is "in front" at the scroll position that brings it to the left edge (or the end).
  useEffect(() => {
    const t = track.current
    if (!t) return
    let frame = 0
    const paint = () => {
      frame = 0
      const max = Math.max(0, t.scrollWidth - t.clientWidth)
      let best = 0
      let bestD = Infinity
      slides().forEach((slide, i) => {
        const at = Math.min(slide.offsetLeft - t.offsetLeft, max)
        const d = Math.abs(at - t.scrollLeft) / Math.max(1, slide.offsetWidth)
        slide.style.setProperty('--focus', String(1 - Math.min(1, d)))
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      const p = max ? t.scrollLeft / max : 1
      progress.current?.style.setProperty('transform', `scaleX(${(1 + p * (count - 1)) / count})`)
      setActive(best)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    paint()
    t.addEventListener('scroll', schedule, { passive: true })
    t.addEventListener('load', schedule, true) // a photo arriving changes the widths
    const ro = new ResizeObserver(schedule)
    ro.observe(t)
    return () => {
      cancelAnimationFrame(frame)
      t.removeEventListener('scroll', schedule)
      t.removeEventListener('load', schedule, true)
      ro.disconnect()
    }
  }, [count])

  // Dragging with a mouse (touch already swipes): snap is off while held, then the nearest slide.
  useEffect(() => {
    const t = track.current
    if (!t) return
    let startX = 0
    let startLeft = 0
    let moved = false
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      startX = e.clientX
      startLeft = t.scrollLeft
      moved = false
      t.classList.add('is-dragging')
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up, { once: true })
    }
    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      t.scrollLeft = startLeft - dx
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      t.classList.remove('is-dragging')
      if (moved) {
        // A drag isn't a click on whatever it ended over.
        t.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true })
      }
    }
    t.addEventListener('pointerdown', down)
    return () => {
      t.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(active + 1)
    else if (e.key === 'ArrowLeft') go(active - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className={`carousel ${className}`.trim()} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className="carousel-track" tabIndex={0} onKeyDown={onKey}>
        {children(active)}
      </div>
      <div className="carousel-bar">
        <span className="carousel-count" aria-live="polite">
          {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
        <span className="carousel-progress" aria-hidden="true">
          <span ref={progress} />
        </span>
        <span className="carousel-arrows">
          <button type="button" aria-label="Previous" disabled={active === 0} onClick={() => go(active - 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button type="button" aria-label="Next" disabled={active === count - 1} onClick={() => go(active + 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </span>
      </div>
      {below?.(active)}
    </div>
  )
}

/** ```carousel: photos at one height and their own widths, the front one's caption beneath. */
export function ImageCarousel({ content }: { name: string; content: string }) {
  const items = lines(content).map(([src, a, b]) => (b === undefined ? { src, title: '', caption: a ?? '' } : { src, title: a, caption: b }))
  if (!items.length) return null
  return (
    <Carousel
      count={items.length}
      label="Photos"
      className="carousel--images"
      below={(active) => (
        <p key={active} className="carousel-caption">
          {items[active].title && <span className="carousel-caption-title">{items[active].title}</span>}
          {items[active].caption}
        </p>
      )}
    >
      {(active) =>
        items.map(({ src, title, caption }, i) => (
          <figure key={src} className={`carousel-slide${i === active ? ' is-active' : ''}`} aria-label={`${i + 1} of ${items.length}`}>
            <img src={src} alt={title || caption} loading="lazy" draggable={false} />
          </figure>
        ))
      }
    </Carousel>
  )
}

/** ```personas: the interviewees as cards on the dark sheet, dealt in as it scrolls into view. */
export function PersonaCarousel({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const people = lines(content).map(([id, archetype, ...rest]) => ({
    id,
    archetype,
    tags: rest.flatMap((group) => group.split(',').map((t) => t.trim())).filter(Boolean),
  }))

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(gsap.utils.selector(root)('.persona'), {
          x: 80,
          rotate: 3,
          autoAlpha: 0,
          stagger: 0.07,
          duration: 1,
          clearProps: 'transform',
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        })
      })
    },
    { scope: root },
  )

  if (!people.length) return null
  return (
    <div ref={root} className="personas sv-feature-panel">
      <SheetMarks />
      <Carousel count={people.length} label="Interviewees" className="carousel--personas">
        {(active) =>
          people.map(({ id, archetype, tags }, i) => (
            <article key={id} className={`persona${i === active ? ' is-active' : ''}`} aria-label={`${id}, ${archetype}`}>
              <p className="persona-id">{id}</p>
              <h4 className="persona-archetype">{archetype}</h4>
              <ul className="persona-tags">
                {tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </article>
          ))
        }
      </Carousel>
    </div>
  )
}
