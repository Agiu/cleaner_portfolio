import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'

/*
 * ```tri-axis: Project Open's breakthrough as a line drawing, in place of the prototype photo: the
 * open-ear foundation (a tube, drawn as an outline) with the speaker seated at its top, and the
 * lower stretch of its inner piece cut away, left as a faint ghost between two break lines. Without
 * it the support rests on the ear and cranium rather than guiding into the ear. Numbered keys tie
 * the parts to a legend set in the page's type, which stays readable at any width. The lines draw
 * in as the sheet scrolls into view (and back out above it).
 */

/** The foundation's outer loop: up from the bottom joint, over the top, and down to the speaker. */
const OUTER = 'M735 650 C746 666 750 684 752 700 C745 740 700 770 660 740 C600 690 550 580 510 490 C480 420 490 350 520 270 C560 160 650 135 700 175 C715 190 725 240 735 305'
/** The inner piece's upper half, kept: from the speaker, round and down. */
const INNER = 'M690 348 C640 336 590 356 565 400 C548 435 560 470 585 500'
/** Its lower half, cut away: down across the ear to the bottom joint. */
const REMOVED = 'M585 500 C630 560 700 600 735 650'
/** Break lines across the tube where it was cut. */
const BREAKS = 'M567 513 L603 487 M716 663 L754 637'
const DEPTH = { x: 6, y: 14 }

/** A cylinder seen end on: its back rim, the two sides, and the front face over them. */
function Cylinder({ x, y, r }: { x: number; y: number; r: number }) {
  const len = Math.hypot(DEPTH.x, DEPTH.y)
  const nx = (-DEPTH.y / len) * r
  const ny = (DEPTH.x / len) * r
  const bx = x + DEPTH.x
  const by = y + DEPTH.y
  return (
    <g>
      <circle className="tri-line" cx={bx} cy={by} r={r} pathLength={1} />
      <path className="tri-line" d={`M${x + nx} ${y + ny} L${bx + nx} ${by + ny} M${x - nx} ${y - ny} L${bx - nx} ${by - ny}`} pathLength={1} />
      <circle className="tri-face" cx={x} cy={y} r={r} />
      <circle className="tri-line" cx={x} cy={y} r={r} pathLength={1} />
      <circle className="tri-line tri-line--faint" cx={x} cy={y} r={r * 0.55} pathLength={1} />
    </g>
  )
}

/** A numbered key beside a part, with a short leader to it. */
function Key({ n, x, y, to }: { n: number; x: number; y: number; to: [number, number] }) {
  return (
    <g className="tri-key">
      <path className="tri-leader" d={`M${x} ${y} L${to[0]} ${to[1]}`} />
      <circle cx={to[0]} cy={to[1]} r={3.5} className="tri-dot" />
      <circle cx={x} cy={y} r={17} className="tri-key-ring" />
      <text x={x} y={y} dy="0.35em" textAnchor="middle">
        {n}
      </text>
    </g>
  )
}

const PARTS = [
  ['Foundation', 'The open-ear loop that rests on the ear and cranium, holding the device in place.'],
  ['Inner piece, lower half', 'Cut away completely, so nothing reaches into the ear and the weight sits on the cranium.'],
] as const

export function TriAxisDrawing() {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const draw = gsap
          .timeline({ paused: true })
          .from(q('.tri-line'), { strokeDashoffset: 1, duration: 1.4, stagger: 0.04, ease: 'power2.inOut' }, 0)
          .from(q('.tri-tube, .tri-face, .tri-ghost'), { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0.5)
          .from(q('.tri-key, .tri-legend li'), { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0.9)
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          onEnter: () => draw.timeScale(1).play(),
          onLeaveBack: () => draw.timeScale(1.6).reverse(),
        })
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="tri-axis">
      <div className="tri-sheet sv-sheet--light sv-feature-panel">
        <SheetMarks />
        <svg className="tri-drawing" viewBox="280 120 760 680" role="img" aria-label="Line drawing of the open-ear foundation with the speaker at its top, and the lower half of its inner piece cut away.">
          {/* The cut-away stretch: a faint outline of the tube it was. */}
          <path className="tri-ghost" d={REMOVED} />
          <path className="tri-tube" d={REMOVED} />
          <path className="tri-line" d={BREAKS} pathLength={1} />
          {/* Each tube: a dark stroke with a lighter one inside it leaves its outline. */}
          <path className="tri-line tri-line--tube" d={INNER} pathLength={1} />
          <path className="tri-tube" d={INNER} />
          <path className="tri-line tri-line--tube" d={OUTER} pathLength={1} />
          <path className="tri-tube" d={OUTER} />
          <Cylinder x={732} y={352} r={52} />
          <Key n={1} x={390} y={330} to={[494, 380]} />
          <Key n={2} x={900} y={620} to={[668, 580]} />
        </svg>
      </div>
      <ol className="tri-legend">
        {PARTS.map(([title, text], i) => (
          <li key={title}>
            <span className="tri-legend-n">{i + 1}</span>
            <div>
              <p className="tri-legend-title">{title}</p>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
