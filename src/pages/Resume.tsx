import { useLayoutEffect, useRef, useState } from 'react'
import { animate, createScope, cubicBezier, onScroll, utils } from 'animejs'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import divider from '../assets/divider.svg'
import { MediaBlock } from '../components/MediaBlock'
import { ArrowLink } from '../components/Profile'
import { duration, greeting, positions, type Position, type ResumeLink, type Shot } from '../data/resume'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { fadeInPage, fadeOutPage } from '../lib/pageTransition'
import { useIntro } from '../lib/useIntro'
import { scrollToTarget } from '../lib/useSmoothScroll'

/** The old recruiter page's rail curve. */
const RAIL_EASE = cubicBezier(0.22, 1, 0.36, 1)
/** Where on screen things arrive: a reading line 15% up from the bottom edge. */
const READ_LINE = '85%'

/**
 * Résumé long form: greeting + position nav in the sidebar, every position with what it
 * changed in the main column, then the ask. Laid out on the case study page's grid.
 */
export function Resume() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(positions[0].id)
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const navigate = useNavigate()
  useIntro(root)

  // Every visit fades the whole page in (the scroll is reset to the top in useRouteScroll).
  useLayoutEffect(() => fadeInPage(root.current), [])

  // The rail, in anime.js, driven by scroll rather than fired all at once: each spine draws
  // down in step with the scroll as its entry passes the reading line, the org's plate strikes
  // on as the line reaches it, and every row rises in on its own as it scrolls into view.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const scope = createScope({ root }).add(() => {
      const rows = utils.$('.resume-entry [data-row]')
      utils.set(utils.$('.resume-spine'), { scaleY: 0, opacity: 0, '--tip': '45%' })
      utils.set(utils.$('.resume-mark'), { opacity: 0, scale: 0.82 })
      utils.set(rows, { opacity: 0, translateY: 18 })

      utils.$('.resume-entry').forEach((entry) => {
        // The line fades up as it draws, with a soft tip that closes once it meets the next plate.
        animate(entry.querySelector('.resume-spine')!, {
          scaleY: [0, 1],
          opacity: [0, 1],
          '--tip': ['45%', '0%'],
          ease: 'linear',
          autoplay: onScroll({ target: entry, enter: `${READ_LINE} top`, leave: `${READ_LINE} bottom`, sync: true }),
        })
        animate(entry.querySelector('.resume-mark')!, {
          opacity: [0, 1],
          scale: [0.82, 1],
          duration: 520,
          ease: RAIL_EASE,
          autoplay: onScroll({ target: entry, enter: `${READ_LINE} top`, repeat: false }),
        })
      })

      // Rows already on screen when the page opens come in as a short stagger behind the
      // intro; everything below waits until it's scrolled to.
      let onScreen = 0
      rows.forEach((row) => {
        const visible = row.getBoundingClientRect().top < window.innerHeight * 0.85
        animate(row, {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 620,
          delay: visible ? 300 + onScreen++ * 70 : 0,
          ease: RAIL_EASE,
          autoplay: onScroll({ target: row, enter: `${READ_LINE} top`, repeat: false }),
        })
      })
    })
    return () => scope.revert()
  }, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      // Nav follows whichever position crosses the middle of the viewport.
      q('.resume-entry').forEach((entry) => {
        ScrollTrigger.create({
          trigger: entry,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => self.isActive && setActive(entry.id),
        })
      })

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        // "Hi, <word>": each salutation rises out of the mask as the last one leaves upward.
        const words = q('.resume-word')
        if (words.length > 1) {
          gsap.set(words.slice(1), { y: 0, yPercent: 135 })
          // One swap at a time, then a hold, so the wrap from the last word back to the first
          // gets the same pause as every other step.
          let current = 0
          let timer: gsap.core.Tween
          const step = () => {
            const next = (current + 1) % words.length
            gsap.to(words[current], { yPercent: -135, duration: 0.8, ease: 'expo.inOut' })
            gsap.fromTo(words[next], { yPercent: 135 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut' })
            current = next
            timer = gsap.delayedCall(2.6, step)
          }
          timer = gsap.delayedCall(2.4, step)
          return () => timer.kill()
        }
      })
    },
    { scope: root },
  )

  const goBack = async (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    await fadeOutPage(root.current)
    navigate(from, { state: { fadeIn: true } })
  }

  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) scrollToTarget(target)
  }

  return (
    <div ref={root} className="layout-sidebar layout-study layout-resume">
      <aside className="sidebar sidebar--study">
        <div className="study-head">
          <h1 className="resume-hello">
            <span className="resume-hi" data-split>
              Hi,
            </span>
            <span className="resume-rotator" aria-live="off">
              {greeting.salutations.map((word, i) => (
                <span key={word} className="resume-word" aria-hidden={i > 0 || undefined}>
                  {word}
                </span>
              ))}
            </span>
          </h1>
          <p className="intro-lead resume-intro" data-split>
            {greeting.intro}
          </p>
        </div>

        <ul className="sidebar-links resume-links">
          <li className="intro-fade">
            <ArrowLink href={greeting.pdf} label="Résumé (PDF)" />
          </li>
          <li className="intro-fade">
            <ArrowLink href={`mailto:${greeting.email}`} label={greeting.email} />
          </li>
        </ul>

        <nav className="resume-nav" aria-label="Positions">
          <ul>
            {positions.map((p) => (
              <li key={p.id} className="intro-fade">
                <a
                  href={`#${p.id}`}
                  className="nav-link"
                  aria-current={active === p.id ? 'location' : undefined}
                  onClick={(e) => goTo(e, p.id)}
                >
                  <img className="nav-line" src={divider} alt="" />
                  {p.navLabel ?? p.org}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link to={from} className="study-back back-drop" onClick={goBack}>
          ← Go Back
        </Link>
      </aside>

      <main className="study-main resume-main">
        <ol className="resume-entries">
          {positions.map((p) => (
            <Entry key={p.id} position={p} />
          ))}
        </ol>

      </main>
    </div>
  )
}

function Entry({ position: p }: { position: Position }) {
  const when = [p.period, p.months ? duration(p.months) : null, p.place].filter(Boolean)

  return (
    <li id={p.id} className="resume-entry" data-kind={p.kind ?? 'role'}>
      {/* The rail: the org's plate, then the line down to the next one. */}
      <div className="resume-rail" aria-hidden="true">
        <span className="resume-mark" data-mark>
          {p.logo ? <img src={p.logo} alt="" /> : <span className="resume-monogram">{monogram(p.org)}</span>}
        </span>
        <span className="resume-spine" data-spine />
      </div>

      <div className="resume-body">
        <h3 className="resume-org" data-row>
          {p.org}
          <span className="resume-role">{p.title}</span>
        </h3>
        <p className="resume-when" data-row>
          {when.map((part) => (
            <span key={part}>{part}</span>
          ))}
          {p.kind === 'education' && <span className="resume-tag">Education</span>}
        </p>
        <p className="resume-summary" data-row>
          {p.summary}
        </p>
        {p.links && <Ctas links={p.links} />}

        {p.impacts.length > 0 && (
          <ul className="resume-impacts">
            {p.impacts.map((impact) => (
              <li key={impact.headline} data-row>
                <h4>{impact.headline}</h4>
                {impact.detail && <p>{impact.detail}</p>}
                {impact.links && <Ctas links={impact.links} />}
              </li>
            ))}
          </ul>
        )}

        {p.shots.length > 0 && (
          <div className="resume-shots" data-count={Math.min(p.shots.length, 2)} data-row>
            {p.shots.map((shot, i) => (
              <ShotFigure key={shot.src || i} shot={shot} />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

/** Initials from the capitals the org writes itself, for an entry with no logo file. */
function monogram(org: string) {
  const caps = org.match(/[A-Z]/g) ?? []
  return caps.slice(0, 3).join('') || org.slice(0, 1).toUpperCase()
}

function ShotFigure({ shot }: { shot: Shot }) {
  return (
    <figure className="resume-shot">
      {shot.src ? (
        <MediaBlock src={shot.src} />
      ) : (
        <div className="media resume-nda">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <rect x="4" y="10.5" width="16" height="10" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span>Under NDA</span>
        </div>
      )}
      {shot.caption && <figcaption className="play-caption">{shot.caption}</figcaption>}
    </figure>
  )
}

function Ctas({ links }: { links: ResumeLink[] }) {
  return (
    <ul className="resume-ctas" data-row>
      {links.map((link) => (
        <li key={link.href}>
          <ArrowLink href={link.href} label={link.label} />
        </li>
      ))}
    </ul>
  )
}
