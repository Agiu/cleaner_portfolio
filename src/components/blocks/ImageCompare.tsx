import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { fenceParts } from './Stage'

/*
 * ```compare: a before and after, stacked, with a handle to drag between them (or arrow keys,
 * through the range input laid over it). Two lines: `url | alt | label`, before then after. As it
 * scrolls into view the handle sweeps across once to show there's something to drag.
 */
export function ImageCompare({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [before, after] = content.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => fenceParts(l))
  const [at, setAt] = useState(50)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const pos = { v: 50 }
        gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true } })
          .to(pos, { v: 18, duration: 0.9, ease: 'power2.inOut', onUpdate: () => setAt(pos.v) })
          .to(pos, { v: 82, duration: 1.2, ease: 'power2.inOut', onUpdate: () => setAt(pos.v) })
          .to(pos, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: () => setAt(pos.v) })
      })
    },
    { scope: root },
  )

  if (!before || !after) return null
  return (
    <div ref={root} className="compare">
      <div className="compare-frame">
        <img className="compare-img" src={after[0]} alt={after[1] ?? ''} draggable={false} />
        <img className="compare-img compare-img--before" src={before[0]} alt={before[1] ?? ''} draggable={false} style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }} />
        <span className="compare-label compare-label--before">{before[2] ?? 'Before'}</span>
        <span className="compare-label compare-label--after">{after[2] ?? 'After'}</span>
        <span className="compare-handle" style={{ left: `${at}%` }} aria-hidden="true">
          <span />
        </span>
        <input
          className="compare-range"
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={at}
          aria-label="Drag to compare before and after"
          onChange={(e) => setAt(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
