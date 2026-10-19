import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'

/*
 * ```renames: names that changed, `Old -> New` per line, on the light sheet. As it scrolls into
 * view each old name is struck through and its new one slides in after the arrow.
 */
export function Renames({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const rows = content
    .split('\n')
    .map((l) => l.split('->').map((part) => part.trim()))
    .filter(([from, to]) => from && to)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } })
          .from(q('.rename-strike'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.15, duration: 0.6, ease: 'power2.inOut' })
          .from(q('.rename-arrow'), { x: -12, autoAlpha: 0, stagger: 0.15, duration: 0.5 }, 0.3)
          .from(q('.rename-to'), { x: -24, autoAlpha: 0, stagger: 0.15, duration: 0.8 }, 0.4)
      })
    },
    { scope: root },
  )

  if (!rows.length) return null
  return (
    <div ref={root} className="renames sv-sheet--light sv-feature-panel">
      <SheetMarks />
      <ul className="renames-list">
        {rows.map(([from, to]) => (
          <li key={from} className="rename">
            <span className="rename-from">
              {from}
              <span className="rename-strike" aria-hidden="true" />
            </span>
            <span className="rename-arrow" aria-hidden="true">
              →
            </span>
            <span className="rename-to">{to}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
