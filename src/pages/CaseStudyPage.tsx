import { useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import divider from '../assets/divider.svg'
import { MediaBlock } from '../components/MediaBlock'
import { findCaseStudy, type Advisor, type CaseStudy, type CaseStudySection } from '../data/caseStudies'
import type { SectionBlock } from '../lib/caseStudyMarkdown'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { fadeOutPage, finishExpand } from '../lib/pageTransition'
import { useIntro } from '../lib/useIntro'
import { scrollToTarget } from '../lib/useSmoothScroll'

export function CaseStudyPage() {
  const { slug } = useParams()
  const study = findCaseStudy(slug)
  if (!study) return <Navigate to="/" replace />
  return <CaseStudyView key={study.slug} study={study} />
}

/** Case study (Figma "Desktop - 6"): details sidebar, image + scrollable section on the right. */
function CaseStudyView({ study }: { study: CaseStudy }) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(study.sections[0]?.id)
  // Arriving from a home card: the expanded image is already covering the hero slot.
  const navState = useLocation().state as { expanded?: boolean; from?: string } | null
  const expanded = Boolean(navState?.expanded)
  // Opened from somewhere other than the home list (e.g. /recruiter): Go Back returns there.
  const backTo = navState?.from ?? '/'
  useIntro(root)

  useLayoutEffect(() => finishExpand(), [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)

      // Active nav item follows whichever section crosses the middle of the viewport.
      q('.study-section').forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => self.isActive && setActive(section.id),
        })
      })

      // Once the hero scrolls away, the project details hand over to section navigation.
      gsap.matchMedia().add(
        { desktop: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' },
        (ctx) => {
          const { desktop, motion } = ctx.conditions as Record<string, boolean>
          if (!desktop) return

          const swap = gsap
            .timeline({ paused: true })
            .to(q('.study-group'), { y: -16, autoAlpha: 0, duration: 0.45, stagger: 0.04, ease: 'power3.in' })
            .set(q('.study-details'), { pointerEvents: 'none' })
            .set(q('.study-nav'), { autoAlpha: 1 })
            .fromTo(
              q('.study-nav-reveal'),
              { yPercent: 110 },
              { yPercent: 0, duration: 0.9, stagger: 0.045, ease: 'expo.out' },
              '-=0.1',
            )

          ScrollTrigger.create({
            trigger: q('.study-hero')[0],
            start: 'bottom 60%',
            onEnter: () => (motion ? swap.timeScale(1).play() : swap.progress(1)),
            onLeaveBack: () => (motion ? swap.timeScale(1.6).reverse() : swap.progress(0)),
          })
        },
      )
    },
    { scope: root },
  )

  const navigate = useNavigate()
  const goBack = async (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    await fadeOutPage(root.current)
    navigate(backTo, { state: { fadeIn: true } })
  }

  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) scrollToTarget(target)
  }

  return (
    <div ref={root} className="layout-sidebar layout-study">
      <aside className="sidebar sidebar--study">
        <div className="study-head">
          <p className="study-year" data-split>
            {study.year}
          </p>
          <h1 className="study-title" data-split>
            {study.title}
          </h1>
          <p className="study-summary intro-fade">{study.summary}</p>
        </div>

        <div className="study-swap">
          <div className="study-details" data-lenis-prevent>
            {study.outcomes.length > 0 && <DetailGroup title="Outcomes" items={study.outcomes} spacious />}
            {study.team.length > 0 && <DetailGroup title="Team Members" items={study.team} />}
            {study.advisors.length > 0 && <AdvisorGroup advisors={study.advisors} />}
          </div>

          <nav className="study-nav" aria-label="Case study sections">
            <span className="study-mask">
              <h2 className="study-group-title study-nav-reveal">Contents</h2>
            </span>
            <ul>
              {study.sections.map((section) => (
                <li key={section.id} className="study-mask">
                  <a
                    href={`#${section.id}`}
                    className="nav-link study-nav-reveal"
                    aria-current={active === section.id ? 'location' : undefined}
                    onClick={(e) => goTo(e, section.id)}
                  >
                    <img className="nav-line" src={divider} alt="" />
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link to="/" className="study-back intro-fade" onClick={goBack}>
          ← Go Back
        </Link>
      </aside>

      <main className="study-main">
        <MediaBlock className="study-hero" src={study.image} video={study.video} withFloat skipReveal={expanded} />
        {study.sections.map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}

/** Advisors: name (linked to LinkedIn when there's a URL), job title small and grey beneath. */
function AdvisorGroup({ advisors }: { advisors: Advisor[] }) {
  return (
    <div className="study-group">
      <h2 className="study-group-title intro-fade">Advisors</h2>
      <ul className="study-list study-list--people intro-fade">
        {advisors.map((a) => (
          <li key={a.name}>
            {a.linkedin ? (
              <a className="study-person-link" href={a.linkedin} target="_blank" rel="noreferrer">
                <span className="study-person-name">{a.name}</span> <span className="contact-arrow">↗</span>
              </a>
            ) : (
              <span>{a.name}</span>
            )}
            {a.role && <span className="study-person-role">{a.role}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DetailGroup({ title, items, spacious = false }: { title: string; items: string[]; spacious?: boolean }) {
  return (
    <div className="study-group">
      <h2 className="study-group-title intro-fade">{title}</h2>
      <ul className={`study-list intro-fade${spacious ? ' study-list--spacious' : ''}`}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One ## section of the case study's Markdown. Runs of text sit in the heading + copy grid;
 * each image row breaks out full width between them, so text and images can alternate.
 */
function Section({ section }: { section: CaseStudySection }) {
  // Split the blocks into alternating runs: consecutive text blocks, or one media row.
  const runs: SectionBlock[][] = []
  for (const block of section.blocks) {
    const last = runs[runs.length - 1]
    if (block.kind !== 'media' && last && last[0].kind !== 'media') last.push(block)
    else runs.push([block])
  }
  // A section that opens on images still gets its heading first.
  if (!runs.length || runs[0][0].kind === 'media') runs.unshift([])

  return (
    <section id={section.id} className="study-section">
      {runs.map((run, i) => {
        const first = run[0]
        if (first?.kind === 'media') {
          return (
            <div
              key={i}
              className="study-media"
              data-count={first.images.length}
              style={first.aspect ? ({ '--aspect': first.aspect } as React.CSSProperties) : undefined}
            >
              {first.images.map((img, j) => (
                <MediaBlock key={j} src={img.src} alt={img.alt} still={first.still} />
              ))}
            </div>
          )
        }
        return (
          <div key={i} className={`study-section-text${i > 0 ? ' study-section-text--more' : ''}`}>
            {i === 0 ? <h2>{section.title}</h2> : <span aria-hidden="true" />}
            <div className="study-section-copy">
              {run.map((block, j) => (
                <TextBlock key={j} block={block} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function TextBlock({ block }: { block: SectionBlock }) {
  switch (block.kind) {
    case 'lead':
      return <p className="study-section-lead" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'subheading':
      return <h3 className="study-section-subheading" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'list':
      return <div className="study-section-list" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'paragraph':
      return <p dangerouslySetInnerHTML={{ __html: block.html }} />
    default:
      return null
  }
}
