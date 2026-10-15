import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { caseStudies, profile } from '../data/caseStudies'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { fadeOutPage } from '../lib/pageTransition'
import { SCENE_COUNT } from '../lib/workReel'
import { EndStamp } from './EndStamp'

/*
 * The Work page's closing plate, bookending the black header reel: a spec sheet for the
 * selection, in the reel's black, white and one grey.
 *
 *   - The two-block mark, on the reel's dot grid: it draws itself on, then every few seconds its
 *     blocks slide past each other and trade places, ghosts trailing, while the readouts on their
 *     corners and the Δx dimension between them count along.
 *   - An index of every study, numbered like a capability profile; each row opens its study.
 *   - The reel's progress bar, every scene played, and the stamp pressed over the closing rule.
 */

const years = caseStudies.map((s) => Number(s.year)).filter(Boolean)
const SPAN = `${Math.min(...years)} — ${Math.max(...years)}`
const pad2 = (n: number) => String(n).padStart(2, '0')

// The mark, in its own 360 x 220 units. Each block is a parallelogram W wide and H tall, its top
// edge pushed S to the right.
const W = 150, H = 36, S = 30
const TOP_Y = 64, LOW_Y = TOP_Y + H + 6
/** Where the blocks rest (upper to the right, lower to the left), and where they trade to; the
 *  outermost callouts stay inside the drawing at either end. */
const REST = { upper: 118, lower: 46 }
const SWAP = { upper: 46, lower: 118 }
const BLOCK = `${S},0 ${W + S},0 ${W},${H} 0,${H}`
const RULE_Y = 200, DIM_Y = 182
/** Readouts in the mark's units scaled up, for numbers with some weight to them. */
const UNIT = 12.5
const fmt = (v: number) => (v * UNIT).toFixed(2).padStart(7, '0')
const fmtDelta = (v: number) => `${v < 0 ? '−' : '+'}${(Math.abs(v) * UNIT).toFixed(2).padStart(7, '0')}`

export function WorkEnd() {
  const root = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  const open = async (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    await fadeOutPage(e.currentTarget.closest<HTMLElement>('.layout-sidebar'))
    navigate(to)
  }

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const upper = q('.we-block--upper')
      const lower = q('.we-block--lower')
      const [upperRead, lowerRead, deltaRead] = el.querySelectorAll<SVGTextElement>('.we-read')
      const dim = el.querySelector<SVGGElement>('.we-dim')!

      // The readouts follow the blocks: each corner reads its block's x, the dimension line spans
      // from one block's start to the other's and reads the difference.
      const readout = () => {
        const u = Number(gsap.getProperty(upper[0], 'x'))
        const l = Number(gsap.getProperty(lower[0], 'x'))
        upperRead.textContent = `X ${fmt(u)}`
        lowerRead.textContent = `X ${fmt(l)}`
        deltaRead.textContent = `ΔX ${fmtDelta(u - l)}`
        const a = Math.min(u, l), b = Math.max(u, l)
        gsap.set(dim, { x: a })
        dim.querySelector('.we-dim-line')!.setAttribute('x2', String(b - a))
        dim.querySelector('.we-dim-end')!.setAttribute('transform', `translate(${b - a} 0)`)
        deltaRead.setAttribute('x', String((b - a) / 2))
      }

      gsap.set(upper, { x: REST.upper, y: TOP_Y })
      gsap.set(lower, { x: REST.lower, y: LOW_Y })
      readout()

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(q('.we-outline'), { strokeDasharray: 1, strokeDashoffset: 1 })
        gsap.set(q('.we-fill'), { scaleX: 0, transformOrigin: '0% 50%' })
        gsap.set(q('.we-seg i'), { scaleX: 0 })

        // Trading places, and back: the ghosts set off a beat behind the blocks they trail.
        const trade = gsap.timeline({ paused: true, repeat: -1, yoyo: true, repeatDelay: 2.4, onUpdate: readout })
        const move = { duration: 1.1, ease: 'expo.inOut' }
        trade
          .to(upper, { x: SWAP.upper, ...move }, 0)
          .to(lower, { x: SWAP.lower, ...move }, 0)
          .to(q('.we-ghost--upper'), { x: SWAP.upper, ...move, stagger: 0.06 }, 0.05)
          .to(q('.we-ghost--lower'), { x: SWAP.lower, ...move, stagger: 0.06 }, 0.05)
          .fromTo(q('.we-ghost'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none', yoyo: true, repeat: 1, repeatDelay: 0.7 }, 0.05)

        // Only while the plate is on screen, and once it has come in.
        let entered = false
        const watch = ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: ({ isActive }) => {
            if (entered) isActive ? trade.play() : trade.pause()
          },
        })

        // The blocks slide in from where they'll trade to as they draw on and fill.
        const enter = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          defaults: { ease: 'expo.out' },
          onUpdate: readout,
          onComplete: () => {
            entered = true
            if (watch.isActive) trade.play()
          },
        })
        enter
          .from(q('.we-bar > *'), { autoAlpha: 0, y: 6, duration: 0.8, stagger: 0.08 }, 0)
          .from(q('.we-grid'), { autoAlpha: 0, duration: 1.2, ease: 'sine.inOut' }, 0.1)
          .from(q('.we-ruler'), { autoAlpha: 0, duration: 0.8 }, 0.2)
          .from(upper, { x: SWAP.upper, duration: 1.6, ease: 'expo.inOut' }, 0.15)
          .from(lower, { x: SWAP.lower, duration: 1.6, ease: 'expo.inOut' }, 0.15)
          .to(q('.we-outline'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: 'power2.inOut' }, 0.2)
          .to(q('.we-fill'), { scaleX: 1, duration: 0.8, stagger: 0.12, ease: 'power3.inOut' }, 1.05)
          .from(q('.we-callout'), { autoAlpha: 0, duration: 0.5, stagger: 0.1 }, 0.9)
          .from(q('.we-row'), { autoAlpha: 0, x: -8, duration: 0.7, stagger: 0.05 }, 0.3)
          .to(q('.we-seg i'), { scaleX: 1, duration: 0.5, stagger: 0.16, ease: 'power2.inOut' }, 0.8)
          .from(q('.we-count, .we-credit'), { autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 1.4)

        return () => {
          trade.kill()
          watch.kill()
        }
      })
    },
    { scope: root },
  )

  const ghosts = (which: 'upper' | 'lower') =>
    [0.32, 0.16].map((opacity, i) => (
      <g key={i} className={`we-ghost we-ghost--${which}`} transform={`translate(${REST[which]} ${which === 'upper' ? TOP_Y : LOW_Y})`}>
        <polygon points={BLOCK} className="we-ghost-line" style={{ opacity }} />
      </g>
    ))

  return (
    <section ref={root} className="work-end" aria-labelledby="work-end-title">
      {['tl', 'tr', 'bl', 'br'].map((c) => (
        <span key={c} className={`we-reg we-reg--${c}`} aria-hidden="true" />
      ))}

      <header className="we-bar">
        <h2 id="work-end-title">Selected work ///// {SPAN}</h2>
        <span aria-hidden="true">End of reel</span>
      </header>

      <div className="we-body">
        <svg className="we-mark" viewBox="0 0 360 220" aria-hidden="true">
          <defs>
            <pattern id="we-dots" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="0.7" className="we-dot" />
            </pattern>
          </defs>
          <rect className="we-grid" width="360" height="220" fill="url(#we-dots)" />

          {ghosts('upper')}
          {ghosts('lower')}

          <g className="we-block we-block--upper">
            <polygon points={BLOCK} className="we-fill" />
            <polygon points={BLOCK} pathLength={1} className="we-outline" />
            <g className="we-callout">
              <line x1={S} y1={0} x2={S} y2={-16} />
              <line x1={W + S} y1={0} x2={W + S + 14} y2={-14} />
              <text className="we-read" x={S + 4} y={-19} />
              <text x={W + S + 17} y={-16}>2200.00</text>
            </g>
          </g>
          <g className="we-block we-block--lower">
            <polygon points={BLOCK} className="we-fill" />
            <polygon points={BLOCK} pathLength={1} className="we-outline" />
            <g className="we-callout">
              <line x1={W} y1={H} x2={W} y2={H + 16} />
              <line x1={0} y1={H} x2={-12} y2={H + 12} />
              <text className="we-read" x={W - 4} y={H + 26} textAnchor="end" />
              <text x={-14} y={H + 22} textAnchor="end">06.000</text>
            </g>
          </g>

          {/* Δx: from one block's start to the other's. */}
          <g className="we-dim we-callout" transform={`translate(0 ${DIM_Y})`}>
            <line className="we-dim-line" x1={0} y1={0} x2={90} y2={0} />
            <line x1={0} y1={-4} x2={0} y2={4} />
            <g className="we-dim-end">
              <line x1={0} y1={-4} x2={0} y2={4} />
            </g>
            <text className="we-read" x={45} y={-6} textAnchor="middle" />
          </g>

          <g className="we-ruler">
            <line x1={10} y1={RULE_Y} x2={350} y2={RULE_Y} />
            {Array.from({ length: 18 }, (_, i) => {
              const x = 10 + i * 20
              return <line key={i} x1={x} y1={RULE_Y} x2={x} y2={RULE_Y + (i % 4 === 0 ? 7 : 3.5)} />
            })}
            {[0, 4, 8, 12, 16].map((i) => (
              <text key={i} x={10 + i * 20 + 3} y={RULE_Y + 14}>
                {String(i * 20 * UNIT).padStart(4, '0')}
              </text>
            ))}
          </g>
        </svg>

        <div className="we-index">
          <div className="we-index-head" aria-hidden="true">
            <span>No.</span>
            <span>Project</span>
            <span className="we-col-discipline">Discipline</span>
            <span>Year</span>
          </div>
          <ol>
            {caseStudies.map((study, i) => {
              const to = `/case-study/${study.slug}`
              return (
                <li key={study.slug} className="we-row">
                  <Link to={to} onClick={(e) => open(e, to)}>
                    <span className="we-col-num">{pad2(i + 1)}</span>
                    <span>{study.title}</span>
                    <span className="we-col-discipline">{study.category}</span>
                    <span>{study.year}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <footer className="we-foot">
        {/* The reel's progress bar, every scene played. */}
        <span className="we-reel" aria-hidden="true">
          <span className="we-segs">
            {Array.from({ length: SCENE_COUNT }, (_, i) => (
              <span key={i} className="we-seg">
                <i />
              </span>
            ))}
          </span>
          <span className="we-count">
            {pad2(SCENE_COUNT)} / {pad2(SCENE_COUNT)}
          </span>
        </span>
        <span className="we-credit">Designed &amp; built by {profile.name}</span>
        <EndStamp className="we-stamp" text={`SELECTED WORK · ${SPAN} · THAT’S THE REEL · `} />
      </footer>
    </section>
  )
}
