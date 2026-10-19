/*
 * ```academic: the v2 layouts' academic slug (Figma 495:135). A line saying where the work was
 * done, centred over a mortarboard. Copies of the cap tile out to the block's edges in the Figma
 * frame's staggered pattern, fading with distance like a radial glow, so the centre cap reads
 * brightest. Drawn in the cap's own units (921 x 777); the field is cropped to the block. As the
 * block scrolls into view the caps ripple out from the centre (and back in above it).
 */

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'

/** The mortarboard outline, from public/work/audio/academic-cap.svg. */
const CAP =
  'M921 182.21L501.41 0L81.7762 182.21V492.761L0 574.745V662.867L113.947 777L227.808 662.824V574.745L146.032 492.761V279.174L501.41 433.441L921 251.274V182.21ZM240.874 390.346L241.173 511.561L501.324 633.764L761.945 511.561V390.346L514.175 497.912L501.41 503.449L488.601 497.869L240.874 390.346Z'
const W = 921
const H = 777
/** The pattern's steps: caps a column apart, alternate rows shifted half a column. */
const STEP_X = 990
const STEP_Y = 400
/** The field's half-size, in cap units; the block crops it (slice). */
const FIELD_X = 3600
const FIELD_Y = 800

/** Seconds the ripple takes to reach the field's edge. */
const WAVE = 0.9

const tiles: { x: number; y: number; opacity: number; r: number }[] = []
for (let row = -3; row <= 3; row++) {
  for (let col = -5; col <= 5; col++) {
    const x = col * STEP_X + (row % 2 ? STEP_X / 2 : 0)
    const y = row * STEP_Y
    if (!x && !y) continue
    // Brightness falls off with (elliptical) distance from the centre, to a faint floor.
    const r = Math.min(1, Math.hypot(x / FIELD_X, y / (FIELD_Y * 1.6)))
    tiles.push({ x, y, opacity: 0.06 + 0.34 * (1 - r) ** 1.6, r: Math.hypot(x / FIELD_X, y / FIELD_X) })
  }
}

export function AcademicSlug({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const caps = gsap.utils.toArray<SVGUseElement>('use', root.current)
        const wave = gsap.from(caps, {
          autoAlpha: 0,
          scale: 0.6,
          transformOrigin: '50% 50%',
          duration: 0.9,
          delay: (i) => Number(caps[i].dataset.r) * WAVE,
          paused: true,
        })
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 80%',
          onEnter: () => wave.timeScale(1).play(),
          onLeaveBack: () => wave.timeScale(1.6).reverse(),
        })
      })
    },
    { scope: root },
  )
  return (
    <div ref={root} className="academic-slug">
      <svg
        className="academic-slug-art"
        viewBox={`${-FIELD_X} ${-FIELD_Y} ${FIELD_X * 2} ${FIELD_Y * 2}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <path id="academic-cap" d={CAP} transform={`translate(${-W / 2} ${-H / 2})`} />
        </defs>
        {tiles.map(({ x, y, opacity, r }, i) => (
          <use key={i} href="#academic-cap" x={x} y={y} style={{ opacity }} data-r={r} />
        ))}
        <use href="#academic-cap" className="academic-slug-cap" data-r={0} />
      </svg>
      <p className="academic-slug-text">{content}</p>
    </div>
  )
}
