import { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import arrowNe from '../assets/arrow-ne.svg'
import linkRule from '../assets/link-rule.svg'
import { profile } from '../data/caseStudies'
import { gsap, useGSAP } from '../lib/gsap'
import { fadeOutPage } from '../lib/pageTransition'
import { useTimeOfDay } from '../lib/timeOfDay'

export function Intro() {
  return (
    <div className="intro">
      <h1 className="intro-name" data-split>
        {profile.name}
      </h1>
      <div className="intro-bio">
        <p className="intro-lead" data-split>
          {profile.bio}
        </p>
        <p className="intro-status" data-split>
          {profile.status}
        </p>
      </div>
    </div>
  )
}

/**
 * Sidebar link row: label, north-east arrow, full-width rule. On hover the rule retracts to the
 * right and redraws from the left, the label nudges in, and the arrow exits up-right while a
 * copy arrives from the bottom-left.
 */
export function ArrowLink({ href, label }: { href: string; label: string }) {
  const root = useRef<HTMLAnchorElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Internal routes ("/recruiter") fade the current page out first, like the other page changes.
  const internal = href.startsWith('/')
  const { contextSafe } = useGSAP({ scope: root })

  const enter = contextSafe(() => {
    if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
    const q = gsap.utils.selector(root)
    gsap.killTweensOf(q('.arrow-link-rule, .arrow-link-icon, .arrow-link-label'))
    gsap.set(q('.arrow-link-icon--out'), { x: 0, y: 0 })
    gsap
      .timeline()
      .to(q('.arrow-link-rule'), { scaleX: 0, transformOrigin: '100% 50%', duration: 0.3, ease: 'power2.in' }, 0)
      .set(q('.arrow-link-rule'), { transformOrigin: '0% 50%' })
      .to(q('.arrow-link-rule'), { scaleX: 1, duration: 0.6, ease: 'expo.out' })
      .to(q('.arrow-link-icon--out'), { x: 14, y: -8, duration: 0.35, ease: 'power2.in' }, 0)
      .fromTo(q('.arrow-link-icon--in'), { x: -14, y: 8 }, { x: 0, y: 0, duration: 0.55, ease: 'expo.out' }, 0.25)
      .to(q('.arrow-link-label'), { x: 4, duration: 0.5, ease: 'expo.out' }, 0)
  })

  const leave = contextSafe(() => {
    const q = gsap.utils.selector(root)
    gsap.to(q('.arrow-link-label'), { x: 0, duration: 0.5, ease: 'expo.out' })
  })

  const follow = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!internal || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    await fadeOutPage(e.currentTarget.closest<HTMLElement>('.layout-sidebar'))
    navigate(href, { state: { from: pathname } })
  }

  return (
    <a
      ref={root}
      className="arrow-link"
      href={href}
      {...(internal ? {} : { target: '_blank', rel: 'noreferrer' })}
      onClick={follow}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <span className="arrow-link-row">
        <span className="arrow-link-label">{label}</span>
        <span className="arrow-link-arrow" aria-hidden="true">
          <img className="arrow-link-icon arrow-link-icon--out" src={arrowNe} alt="" />
          <img className="arrow-link-icon arrow-link-icon--in" src={arrowNe} alt="" />
        </span>
      </span>
      <img className="arrow-link-rule" src={linkRule} alt="" />
    </a>
  )
}

export function SidebarLinks() {
  const linkedin = profile.links.find((l) => l.label === 'Linkedin')!
  return (
    <ul className="sidebar-links">
      <li className="intro-fade">
        <ArrowLink href="/recruiter" label="Resume" />
      </li>
      <li className="intro-fade">
        <ArrowLink href={linkedin.href} label="LinkedIn" />
      </li>
    </ul>
  )
}

/**
 * Oil-like bridge between the two squares. It's two fillets filling the concave corners at each
 * end of the edge the squares share (x = 8). Rebuilt every frame from the squares' positions, so
 * it stays attached and bends with them: it stretches vertically (and thins) with speed, and melts
 * to nothing as the squares line up mid-swap, re-forming on the opposite corners. At rest it matches
 * the exported Figma bridge (curves with both control points on the corner).
 */
function bridgePath(ya: number, yb: number, stretch: number) {
  const diff = Math.abs(ya - yb) // how far one square's side sticks out past the other's
  const rv = Math.min(4 * stretch, diff)
  const rh = Math.min(4 / Math.sqrt(stretch), diff)
  if (rv < 0.05 || rh < 0.05) return ''
  const top = Math.max(ya, yb) // top end of the shared edge
  const bot = Math.min(ya, yb) + 8 // bottom end
  const topDir = ya < yb ? 1 : -1 // fillet flows onto whichever square sits lower at that end
  const botDir = ya > yb ? 1 : -1
  const fillet = (y: number, dy: number, dir: number) =>
    `M8 ${y + dy}C8 ${y} 8 ${y} ${8 + dir * rh} ${y}L8 ${y}Z`
  return fillet(top, -rv, topDir) + fillet(bot, rv, botDir)
}

/**
 * Footer mark from the Figma frame: two squares meeting at a corner, joined by the oily bridge.
 * Per the designer's note, the squares slide vertically past each other in alternating directions
 * while the bridge keeps their corners meshed.
 */
function FooterMark() {
  const root = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const [a, b] = q('.mark-square')
      const bridge = q('.mark-bridge')[0]
      const pos = { ya: 0, yb: 8 }
      let lastYa = pos.ya
      let lastT = performance.now()
      let stretch = 1

      const draw = () => {
        const now = performance.now()
        const dt = Math.max(1, now - lastT) / 1000
        const speed = Math.abs(pos.ya - lastYa) / dt // px/s; peaks around 15
        lastYa = pos.ya
        lastT = now
        // Ease the stretch toward the speed-based target so the oil lags and settles, not snaps.
        stretch += (1 + Math.min(speed / 15, 1.4) - stretch) * 0.25
        a.setAttribute('y', `${pos.ya}`)
        b.setAttribute('y', `${pos.yb}`)
        bridge.setAttribute('d', bridgePath(pos.ya, pos.yb, stretch))
      }
      draw()

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const slide = (ya: number, yb: number) => ({ ya, yb, duration: 1.1, ease: 'power3.inOut' })
        const tl = gsap
          .timeline({ repeat: -1, repeatDelay: 1.4, delay: 1 })
          .to(pos, slide(8, 0)) // top-left square slides down, bottom-right slides up
          .to(pos, slide(0, 8), '+=1.4') // then back the other way
        // Redraw once per frame on GSAP's ticker, which also lets the stretch relax after each slide.
        gsap.ticker.add(draw)
        return () => {
          tl.kill()
          gsap.ticker.remove(draw)
        }
      })
    },
    { scope: root },
  )

  return (
    <svg ref={root} className="footer-mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <rect className="mark-square" x="0" y="0" width="8" height="8" />
      <rect className="mark-square" x="8" y="8" width="8" height="8" />
      <path className="mark-bridge" d={bridgePath(0, 8, 1)} />
    </svg>
  )
}

export function SidebarFooter() {
  // The mark lights up in the header's current time-of-day colour on hover.
  const { swatches } = useTimeOfDay()
  return (
    <footer className="sidebar-footer" style={{ '--tod': swatches[1] } as React.CSSProperties}>
      {/* GSAP fades the <p> in on load; the hover crossfade lives on the inner span so the two never fight. */}
      <p className="intro-fade">
        <span className="footer-credit">Designed and Developed by Caleb</span>
      </p>
      <span className="footer-mark-wrap">
        <span className="footer-mark-note">always thinking</span>
        <FooterMark />
      </span>
    </footer>
  )
}
