import { useLayoutEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import divider from '../assets/divider.svg'
import { HomeHeader } from '../components/HomeHeader'
import { Intro, SidebarFooter, SidebarLinks } from '../components/Profile'
import { gsap, useGSAP } from '../lib/gsap'
import { fadeInPage, fadeOutPage } from '../lib/pageTransition'
import { useIntro } from '../lib/useIntro'

const NAV = [
  { to: '/', label: 'Work' },
  { to: '/play', label: 'Play' },
  { to: '/about', label: 'About' },
]

/**
 * Shared shell for Work, Play and About: the sidebar stays put while only the
 * right-hand content cross-fades between pages.
 */
export function SiteLayout() {
  const root = useRef<HTMLDivElement>(null)
  const main = useRef<HTMLElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const prevPath = useRef(pathname)
  useIntro(root)

  useLayoutEffect(() => {
    if (prevPath.current === pathname) {
      // First render of the shell. Returning via "Go Back": the case study faded out, so fade it all in.
      if ((state as { fadeIn?: boolean } | null)?.fadeIn) fadeInPage(root.current)
      return
    }
    prevPath.current = pathname
    fadeInPage(main.current)
  }, [pathname])

  // On About the name + bio step aside so the right-hand copy leads; the nav slides up into their place.
  const introPath = useRef<string | null>(null)
  useGSAP(
    () => {
      const intro = root.current?.querySelector<HTMLElement>('.intro')
      if (!intro) return
      const hide = pathname === '/about'
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Instant on first render (and StrictMode's re-run of it); animated only on an actual page change.
      const changed = introPath.current !== null && introPath.current !== pathname
      const duration = changed && !reduce ? 0.8 : 0
      introPath.current = pathname

      if (hide) {
        // Collapse fully (height and padding); the nav's own top padding then sets its inset.
        gsap.to(intro, { height: 0, paddingTop: 0, paddingBottom: 0, autoAlpha: 0, overflow: 'hidden', duration, ease: 'expo.inOut' })
      } else if (intro.style.height) {
        // Read the real expanded size from CSS first (tweening to 'auto' would measure it with the
        // collapsed padding and snap at the end), then grow back to exactly that.
        const from = { height: intro.offsetHeight, paddingTop: 0, paddingBottom: 0 }
        gsap.set(intro, { clearProps: 'height,paddingTop,paddingBottom' })
        const cs = getComputedStyle(intro)
        const to = { height: intro.offsetHeight, paddingTop: parseFloat(cs.paddingTop), paddingBottom: parseFloat(cs.paddingBottom) }
        gsap.set(intro, from)

        gsap.to(intro, {
          ...to,
          autoAlpha: 1,
          duration,
          ease: 'expo.inOut',
          clearProps: 'height,paddingTop,paddingBottom,overflow',
        })
      }
    },
    { dependencies: [pathname], scope: root },
  )

  // About gets a Go Back bar at the top of the sidebar. Arriving, a slot opens and the bar drops
  // into it from above; leaving, it recedes back up into the top as the slot closes.
  const aboutBack = pathname === '/about'
  useGSAP(
    () => {
      const slot = back.current
      const bar = slot?.firstElementChild
      if (!slot || !bar) return
      const d = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1
      if (aboutBack) {
        gsap
          .timeline()
          .to(slot, { height: 43, duration: 0.6 * d, ease: 'expo.inOut' })
          .fromTo(bar, { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9 * d, ease: 'expo.out' }, 0.15 * d)
      } else if (slot.offsetHeight > 0) {
        gsap
          .timeline()
          .to(bar, { yPercent: -100, autoAlpha: 0, duration: 0.5 * d, ease: 'power2.in' })
          .to(slot, { height: 0, duration: 0.6 * d, ease: 'expo.inOut' }, 0.1 * d)
      }
    },
    { dependencies: [aboutBack], scope: root },
  )

  const go = async (e: React.MouseEvent, to: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (to === pathname) return
    await Promise.all([fadeOutPage(main.current), fadeOutPage(header.current)])
    navigate(to)
  }

  return (
    <div ref={root} className="layout-sidebar layout-site">
      {/* Work's datamosh header lives in the shell, not the page, so on phones it can sit above
          the name; on desktop CSS grid places it at the top of the right-hand column. */}
      {pathname === '/' && (
        <div ref={header} className="site-header">
          <HomeHeader />
        </div>
      )}
      <aside className="sidebar sidebar--home">
        <div className="sidebar-top">
          <div ref={back} className="site-back">
            <Link
              to="/"
              className="study-back"
              onClick={(e) => go(e, '/')}
              tabIndex={aboutBack ? undefined : -1}
              aria-hidden={aboutBack ? undefined : true}
            >
              ← Go Back
            </Link>
          </div>
          <Intro />
          <SidebarLinks />
          <nav className="site-nav" aria-label="Primary">
            <ul>
              {NAV.map((item) => (
                <li key={item.to} className="intro-fade">
                  <NavLink to={item.to} end className="nav-link" onClick={(e) => go(e, item.to)}>
                    <img className="nav-line" src={divider} alt="" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <SidebarFooter />
      </aside>
      <main ref={main} className="sidebar-main">
        <Outlet />
      </main>
    </div>
  )
}
