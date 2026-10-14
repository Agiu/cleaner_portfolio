import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

/** Passes the marks make down the list once it has settled, and how long the whole run takes. */
const SWEEP_PASSES = 3
const SWEEP_SECONDS = 1.6

/**
 * ```stream — one recorded field per line. Reads as a list in the copy column, hung off a spine:
 * the spine draws down and the rows arrive behind it, then a pulse runs down the marks three
 * times, faster each pass — the same fields recorded again and again while the aircraft moves.
 */
export function TrackStream({ content }: { content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const items = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const marks = q('.proto-stream-mark') as HTMLElement[]
        const light = (live: number) => marks.forEach((mark, i) => mark.classList.toggle('is-live', i === live))
        const playhead = { p: 0 }

        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: 'top 85%', once: true } })
          .fromTo(q('.proto-stream-spine'), { scaleY: 0 }, { scaleY: 1, duration: 0.9 }, 0)
          .fromTo(q('.proto-stream-item'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.2)
          .to(
            playhead,
            {
              p: SWEEP_PASSES,
              duration: SWEEP_SECONDS,
              ease: 'power2.in',
              onUpdate: () => light(Math.min(marks.length - 1, Math.floor((playhead.p % 1) * marks.length))),
              onComplete: () => light(-1),
            },
            '-=0.3',
          )
      })
    },
    { scope: root },
  )

  if (!items.length) return null

  return (
    <div ref={root} className="proto-stream">
      <span className="proto-stream-spine" aria-hidden="true" />
      <ul>
        {items.map((item, i) => (
          <li key={i} className="proto-stream-item">
            <span className="proto-stream-mark" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
