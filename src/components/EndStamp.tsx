import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

/*
 * The sign-off pressed onto the Work page's closing plate (WorkEnd): a small rubber stamp drawn
 * in the header reel's line art, in whatever colour it sits in. Every ring is a scene from the
 * reel: the Xbox wheel's tick ring and pointer (it spins up and settles, and again on hover), the
 * contour lines Project Open and ForeFlight are drawn in, over the reel's dot grid, and
 * ForeFlight's plane flying a lap of its route. The check at the centre is the approval.
 */

const C = 100 // centre of the 200 x 200 drawing
const TEXT_R = 85.5

/** A closed contour around the centre: a circle of radius r, rippled by two slow waves. */
function contour(r: number, a: number, phase: number) {
  const pts: string[] = []
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2
    const rr = r + a * Math.sin(3 * t + phase) + a * 0.6 * Math.sin(5 * t - phase * 1.7)
    pts.push(`${(C + Math.cos(t) * rr).toFixed(2)},${(C + Math.sin(t) * rr).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}
const CONTOURS = [contour(25, 1.6, 0.4), contour(34, 2.4, 1.3), contour(43, 2.8, 2.2)]

/** The wheel's ticks: every sixth one long. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2
  const r0 = i % 6 === 0 ? 63 : 66.5
  return { x1: C + Math.cos(a) * r0, y1: C + Math.sin(a) * r0, x2: C + Math.cos(a) * 70, y2: C + Math.sin(a) * 70 }
})

/** text: what runs round the rim. */
export function EndStamp({ text, className = '' }: { text: string; className?: string }) {
  const root = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const mark = root.current!
        const spin = (turns: number, duration: number) =>
          gsap.fromTo(
            q('.end-stamp-ticks'),
            { rotation: -360 * turns },
            { rotation: 0, duration, ease: 'power3.out', svgOrigin: `${C} ${C}`, overwrite: true },
          )

        gsap.set(q('.end-stamp-draw'), { strokeDasharray: 1, strokeDashoffset: 1 })

        const tl = gsap.timeline({
          scrollTrigger: { trigger: mark, start: 'top 92%', once: true },
          defaults: { ease: 'expo.out' },
        })
        // Pressed down hard, a little skewed, then it settles where it landed.
        tl.fromTo(mark, { autoAlpha: 0, scale: 1.4, rotation: -18 }, { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.42, ease: 'power4.in' }, 0)
          .to(mark, { scale: 0.96, duration: 0.07, ease: 'power1.out' }, 0.42)
          .to(mark, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.49)
          .add(() => spin(2, 2.2), 0.45)
          .from(q('.end-stamp-grid, .end-stamp-route'), { autoAlpha: 0, duration: 0.9, ease: 'sine.inOut' }, 0.5)
          .to(q('.end-stamp-contour'), { strokeDashoffset: 0, duration: 1.4, stagger: 0.16, ease: 'power2.inOut' }, 0.55)
          .to(q('.end-stamp-check'), { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 1.25)
          // The plane flies its lap for as long as the page is open.
          .add(() => {
            gsap.to(q('.end-stamp-plane'), { rotation: 360, duration: 18, ease: 'none', repeat: -1, svgOrigin: `${C} ${C}` })
          }, 0.9)

        const respin = () => {
          if (tl.progress() === 1) spin(1, 1.6)
        }
        mark.addEventListener('pointerenter', respin)
        return () => mark.removeEventListener('pointerenter', respin)
      })
    },
    { scope: root },
  )

  return (
    <svg ref={root} className={`end-stamp ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="end-stamp-text" d={`M${C - TEXT_R},${C} a${TEXT_R},${TEXT_R} 0 1,1 ${TEXT_R * 2},0 a${TEXT_R},${TEXT_R} 0 1,1 ${-TEXT_R * 2},0`} />
        <pattern id="end-stamp-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.6" className="end-stamp-fill" />
        </pattern>
        <clipPath id="end-stamp-clip">
          <circle cx={C} cy={C} r="54" />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r="97" className="end-stamp-line" strokeWidth="1.4" />
      <text className="end-stamp-ring-text">
        <textPath href="#end-stamp-text" textLength={Math.PI * 2 * TEXT_R - 6} lengthAdjust="spacing">
          {text}
        </textPath>
      </text>
      <circle cx={C} cy={C} r="76" className="end-stamp-line" />

      {/* The Xbox wheel: ticks that spin and settle under a fixed pointer. */}
      <g className="end-stamp-ticks">
        {TICKS.map((t, i) => (
          <line key={i} {...t} className="end-stamp-line" />
        ))}
      </g>
      <path d={`M${C - 4},${C - 75.5} H${C + 4} L${C},${C - 68.5} Z`} className="end-stamp-fill" />

      {/* The reel's dot grid, under the contours. */}
      <rect className="end-stamp-grid" x="40" y="40" width="120" height="120" fill="url(#end-stamp-dots)" clipPath="url(#end-stamp-clip)" />
      {CONTOURS.map((d, i) => (
        <path key={i} d={d} pathLength={1} className="end-stamp-line end-stamp-draw end-stamp-contour" />
      ))}

      {/* ForeFlight's route, and the plane on it, nose along the lap. */}
      <circle cx={C} cy={C} r="55" className="end-stamp-line end-stamp-route" strokeDasharray="1.5 3" />
      <g className="end-stamp-plane">
        <path d={`M${C + 5},${C - 55} L${C - 3},${C - 59.5} L${C - 1},${C - 55} L${C - 3},${C - 50.5} Z`} className="end-stamp-fill" />
      </g>

      <circle cx={C} cy={C} r="16" className="end-stamp-fill" />
      <path d={`M${C - 7},${C + 0.5} L${C - 2},${C + 5.5} L${C + 7.5},${C - 5}`} pathLength={1} className="end-stamp-draw end-stamp-check" />
    </svg>
  )
}
