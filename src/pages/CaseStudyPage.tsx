import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import divider from '../assets/divider.svg'
import { Arrow } from '../components/Arrow'
import { AudioTracks } from '../components/AudioTracks'
import { fitsNoteBeside, isWidePrototype, Prototype } from '../components/blocks'
import { CodeBlock } from '../components/CodeBlock'
import { heroScenes } from '../components/heroes'
import { MediaBlock } from '../components/MediaBlock'
import { SheetMarks } from '../components/SheetMarks'
import { ArrowLink } from '../components/Profile'
import { CaseStudyCompact } from '../components/CaseStudyCompact'
import { findCaseStudy, nextCaseStudies, openCaseStudy, type Advisor, type CaseStudy, type CaseStudySection } from '../data/caseStudies'
import type { SectionBlock } from '../lib/caseStudyMarkdown'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { fadeOutPage, finishExpand } from '../lib/pageTransition'
import { unlocked, unlockRemembered } from '../lib/protectedPages'
import { useIntro } from '../lib/useIntro'
import { scrollToTarget } from '../lib/useSmoothScroll'

const PHONE = '(max-width: 899px)'
const watchPhone = (change: () => void) => {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}
/** Whether the page is in its phone layout (the stylesheet's 899px breakpoint). */
const usePhone = () => useSyncExternalStore(watchPhone, () => window.matchMedia(PHONE).matches)

export function CaseStudyPage() {
  const { slug } = useParams()
  const study = findCaseStudy(slug)
  if (!study || study.locked) return <Navigate to="/" replace />
  return study.protected ? <ProtectedCaseStudy key={study.slug} study={study} /> : <CaseStudyView key={study.slug} study={study} />
}

/**
 * A study behind a password opens only once unlocked (from the Work page's modal, or with the
 * password this browser remembers). Otherwise its URL sends you to the Work page, which asks.
 */
function ProtectedCaseStudy({ study }: { study: CaseStudy }) {
  const [state, setState] = useState<'checking' | 'open' | 'locked'>(() => (unlocked(study.slug) ? 'open' : 'checking'))
  useEffect(() => {
    if (state !== 'checking') return
    let live = true
    unlockRemembered(study.slug).then((ok) => live && setState(ok ? 'open' : 'locked'))
    return () => {
      live = false
    }
  }, [state, study.slug])

  const open = state === 'open' ? openCaseStudy(study) : null
  if (open) return <CaseStudyView study={open} />
  if (state === 'locked') return <Navigate to="/" replace state={{ unlock: study.slug }} />
  return null
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
  // A study whose hero is a scene (heroes/) shows it over its still image.
  const HeroScene = heroScenes[study.slug]
  useIntro(root)
  const phone = usePhone()

  // Hold the expanded overlay (which may be showing the card's playing video) until the hero's
  // video is running underneath it, so the handover doesn't flash back to the still.
  useLayoutEffect(() => {
    const v = root.current?.querySelector<HTMLVideoElement>('.study-hero video')
    if (!v || !v.paused) return finishExpand()
    const done = () => {
      clearTimeout(timer)
      finishExpand()
    }
    const timer = setTimeout(done, 1500)
    v.addEventListener('playing', done, { once: true })
    return () => {
      clearTimeout(timer)
      v.removeEventListener('playing', done)
    }
  }, [])

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
          <p className="study-crumb intro-fade">
            {study.year}
          </p>
          <h1 className="study-title" data-split>
            {study.title}
          </h1>
          <p className="study-summary intro-fade">{study.summary}</p>
        </div>

        <div className="study-swap">
          {/* A scroll box of its own in the desktop sidebar, so it keeps the wheel; on a phone it runs
              in the page's flow and leaves the wheel to the page's smooth scroll. */}
          <div className="study-details" data-lenis-prevent={phone ? undefined : true}>
            {study.outcomes.length > 0 && <DetailGroup title="Outcomes" items={study.outcomes} spacious />}
            {study.links && (
              <ul className="sidebar-links study-links">
                {study.links.map((link) => (
                  <li key={link.href} className="intro-fade">
                    <ArrowLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            )}
            {study.team.length > 0 && (
              <PeopleGroup title="Team Members" people={study.team.map((p) => (typeof p === 'string' ? { name: p } : p))} />
            )}
            {study.advisors.length > 0 && <PeopleGroup title="Advisors" people={study.advisors} />}
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

        <Link to="/" className="study-back back-drop" onClick={goBack}>
          <Arrow dir="w" /> Go Back
        </Link>
      </aside>

      <main className="study-main">
        <MediaBlock className="study-hero" src={HeroScene ? study.image : (study.animation ?? study.image)} video={study.video} videoStart={study.videoStart} withFloat skipReveal={expanded}>
          {HeroScene && <HeroScene />}
          {study.heroLine && (
            <div className="study-hero-line">
              <p data-split>{study.heroLine}</p>
            </div>
          )}
          {study.videoCredit && (
            <p className="media-credit">
              {/* Stacked copies, each blending over the last: strip the colour from the video behind,
                  snap it to black or white, then invert it. Only the last copy is read out. */}
              {['mono', 'burn', 'dodge'].map((layer) => (
                <span key={layer} className={`media-credit-${layer}`} aria-hidden="true">
                  {study.videoCredit}
                </span>
              ))}
              <span className="media-credit-invert">{study.videoCredit}</span>
            </p>
          )}
        </MediaBlock>
        {study.sections.map((section) =>
          study.layout === 'v2' ? <SectionV2 key={section.id} section={section} /> : <Section key={section.id} section={section} />,
        )}
        {/* Two studies to read next, as the Work page's More work cards. */}
        <section className="cs-more study-more" aria-labelledby="study-more-title">
          <h2 id="study-more-title" className="cs-more-title">
            More work
          </h2>
          <div className="cs-more-grid">
            {nextCaseStudies(study.slug).map((next) => (
              <CaseStudyCompact key={next.slug} study={next} fade />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

/** Team members and advisors: name (linked to LinkedIn when there's a URL), job title small and grey beneath. */
function PeopleGroup({ title, people }: { title: string; people: Advisor[] }) {
  return (
    <div className="study-group">
      <h2 className="study-group-title intro-fade">{title}</h2>
      <ul className="study-list study-list--people intro-fade">
        {people.map((a) => (
          <li key={a.name}>
            {a.linkedin ? (
              <a className="study-person-link" href={a.linkedin} target="_blank" rel="noreferrer">
                <span className="study-person-name">{a.name}</span> <span className="contact-arrow"><Arrow dir="ne" /></span>
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

/** Image rows and wide prototypes break out of the text grid; everything else sits in the copy. */
const isWide = (block: SectionBlock) =>
  (block.kind === 'media' && !block.side) || (block.kind === 'prototype' && isWidePrototype(block.name))
/** A "side" image starts a text run of its own and sits in its left column. */
const isSide = (block: SectionBlock) => block.kind === 'media' && block.side

/**
 * One ## section of the case study's Markdown. Runs of text sit in the heading + copy grid;
 * each image row or wide prototype breaks out full width between them, so they can alternate.
 */
function Section({ section }: { section: CaseStudySection }) {
  // A note written beside a prototype that has no room for one drops below it instead.
  const blocks = section.blocks.flatMap((block): SectionBlock[] =>
    block.kind === 'prototype' && block.aside && !fitsNoteBeside(block.name)
      ? [{ ...block, aside: undefined }, { kind: 'note', html: block.aside }]
      : [block],
  )

  // Split the blocks into alternating runs: consecutive text blocks, or one wide block.
  const runs: SectionBlock[][] = []
  for (const block of blocks) {
    const last = runs[runs.length - 1]
    if (!isWide(block) && !isSide(block) && last && !isWide(last[0])) last.push(block)
    else runs.push([block])
  }
  // A section that opens on images still gets its heading first.
  if (!runs.length || isWide(runs[0][0]) || isSide(runs[0][0])) runs.unshift([])

  return (
    <section id={section.id} className="study-section">
      {runs.map((run, i) => {
        const first = run[0]
        if (first?.kind === 'media' && first.side) {
          return (
            <div key={i} className={`study-section-text study-section-text--side${i > 0 ? ' study-section-text--more' : ''}`}>
              <div className="study-side-media" style={first.aspect ? ({ '--aspect': first.aspect } as React.CSSProperties) : undefined}>
                {first.images.map((img, j) => (
                  <figure key={j} className="study-figure">
                    <MediaBlock src={img.src} still={first.still} className={first.clear ? 'media--clear' : ''} />
                    {img.alt && <figcaption>{img.alt}</figcaption>}
                  </figure>
                ))}
              </div>
              <div className="study-section-copy">
                {run.slice(1).map((block, j) => (
                  <TextBlock key={j} block={block} />
                ))}
              </div>
            </div>
          )
        }
        if (first?.kind === 'media') {
          return (
            <div
              key={i}
              className="study-media"
              data-count={first.images.length}
              style={first.aspect ? ({ '--aspect': first.aspect } as React.CSSProperties) : undefined}
            >
              {first.images.map((img, j) => (
                // The alt text is the caption: shown under the image, so the image itself is
                // left unlabelled rather than read out twice.
                <figure key={j} className="study-figure" style={first.maxWidth ? { maxWidth: first.maxWidth } : undefined}>
                  <MediaBlock src={img.src} still={first.still} className={first.clear ? 'media--clear' : ''} />
                  {img.alt && <figcaption>{img.alt}</figcaption>}
                </figure>
              ))}
            </div>
          )
        }
        if (first?.kind === 'prototype' && isWide(first)) {
          return (
            <div key={i} className={`study-proto${first.aside ? ' study-proto--aside' : ''}`}>
              <Prototype name={first.name} content={first.content} />
              {first.aside && <p className="study-section-note" dangerouslySetInnerHTML={{ __html: first.aside }} />}
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

type MediaRow = Extract<SectionBlock, { kind: 'media' }>

/** One image row's images as v2 figures, each with its caption as a note underneath. */
function V2Figures({ row, className }: { row: MediaRow; className: string }) {
  return row.images.map((img, j) => (
    <figure key={j} className={className} style={ratioStyle(img.aspect ?? row.aspect)}>
      <MediaBlock src={img.src} still={row.still} className={row.clear ? 'media--clear' : ''} />
      {img.alt && <figcaption className="sv-note">{img.alt}</figcaption>}
    </figure>
  ))
}

/** An image's ratio for the frame (--aspect) and, as a number, for its share of the row. */
const ratioStyle = (aspect?: string) => {
  const [w, h] = (aspect ?? '').split('/').map(Number)
  return w > 0 && h > 0 ? ({ '--aspect': aspect, '--aspect-n': w / h } as React.CSSProperties) : undefined
}

/** A row of one image taller than it is wide. */
const isPortrait = (row: MediaRow) => {
  const [w, h] = (row.aspect ?? '').split('/').map(Number)
  return row.images.length === 1 && w > 0 && h > 0 && w / h < 1
}
/** A paragraph that's a single ==highlight== and nothing else reads as a statement of its own. */
const isStatement = (block: SectionBlock) => block.kind === 'paragraph' && /^<mark>(?:(?!<\/?mark>)[\s\S])*<\/mark>$/.test(block.html.trim())

type V2Run =
  | { kind: 'text'; blocks: SectionBlock[]; afterMedia: boolean }
  | { kind: 'statement'; html: string }
  | { kind: 'media'; row: MediaRow }
  | { kind: 'half' | 'sticky'; row: MediaRow; blocks: SectionBlock[] }
  | { kind: 'wide'; block: Extract<SectionBlock, { kind: 'prototype' }> }
  | { kind: 'feature'; blocks: SectionBlock[] }
  | { kind: 'impact'; blocks: SectionBlock[] }
  | { kind: 'panel'; variant: 'tracks' | 'code'; intro: SectionBlock[]; block: SectionBlock }

/**
 * The subheading closing the run before a panel (with one paragraph after it, if there is one),
 * taken out of that run to introduce the panel instead.
 */
const pullIntro = (run: V2Run | undefined): SectionBlock[] => {
  if (run?.kind !== 'text' && run?.kind !== 'half' && run?.kind !== 'sticky') return []
  const { blocks } = run
  const n = blocks.length
  if (blocks[n - 1]?.kind === 'subheading') return blocks.splice(n - 1)
  if (blocks[n - 2]?.kind === 'subheading' && blocks[n - 1]?.kind === 'paragraph') return blocks.splice(n - 2)
  return []
}

/** Statement lists (```hmw, rules, questions) stand as a block of their own, not a note in the copy. */
const isFeature = (block: SectionBlock) => block.kind === 'prototype' && ['hmw', 'rules', 'questions'].includes(block.name)

/**
 * One ## section in the v2 layouts (Figma 495:77), on trial for Project Open:
 *  - text: the section's title as a small grey label over its lead in bold, then the copy, in
 *    one centred column. Copy that carries on after an image row sits in a column to the right.
 *  - an image row: edge to edge with a small inset, images side by side at their own
 *    proportions (so heights match), each caption a note under its image.
 *  - half: a portrait image fills half the block, beside the copy that follows it.
 *  - sticky ("side"): a small image held in view beside the copy that follows it.
 *  - a paragraph that's only a ==highlight==: a statement of its own (see Statement).
 *  - wide prototypes (quotes, 3D model, video, the academic slug) run full width; the academic
 *    slug always opens its section, above the label.
 *  - a statement list (```hmw…) is a block of its own, with a ```button straight after it beneath
 *    (see Feature).
 *  - ```stats get a dark panel of their own (see Impact), taking the subheading just before them
 *    and a ```button just after.
 *  - audio tracks and code get a dark panel too, introduced by the subheading (and paragraph)
 *    just before them: the tracks beside their intro, the code beneath it.
 */
function SectionV2({ section }: { section: CaseStudySection }) {
  const runs: V2Run[] = []
  for (const block of section.blocks) {
    const last = runs[runs.length - 1]
    if (block.kind === 'media' && !block.side && isPortrait(block)) runs.push({ kind: 'half', row: block, blocks: [] })
    else if (block.kind === 'media' && block.side) runs.push({ kind: 'sticky', row: block, blocks: [] })
    else if (block.kind === 'media') runs.push({ kind: 'media', row: block })
    else if (block.kind === 'prototype' && isWidePrototype(block.name)) runs.push({ kind: 'wide', block })
    // A note straight after a wide block (a video, say) is its caption, even with a blank line between.
    else if (block.kind === 'note' && last?.kind === 'wide' && !last.block.aside) last.block = { ...last.block, aside: block.html }
    else if (isFeature(block)) runs.push({ kind: 'feature', blocks: [block] })
    else if (block.kind === 'prototype' && block.name === 'stats') {
      // Stats take their own dark panel, with the subheading that introduces them.
      const heading = last?.kind === 'text' && last.blocks[last.blocks.length - 1]?.kind === 'subheading' ? last.blocks.pop()! : null
      runs.push({ kind: 'impact', blocks: heading ? [heading, block] : [block] })
    } else if (block.kind === 'audio' || block.kind === 'code') {
      // Audio tracks and code take a dark panel, introduced by the subheading before them.
      const intro = pullIntro(last)
      if (last?.kind === 'text' && !last.blocks.length && runs.length > 1) runs.pop()
      runs.push({ kind: 'panel', variant: block.kind === 'audio' ? 'tracks' : 'code', intro, block })
    } else if ((last?.kind === 'feature' || last?.kind === 'impact') && block.kind === 'prototype' && block.name === 'button')
      last.blocks.push(block)
    else if ((last?.kind === 'half' || last?.kind === 'sticky') && !isStatement(block)) last.blocks.push(block)
    else if (isStatement(block)) runs.push({ kind: 'statement', html: block.kind === 'paragraph' ? block.html : '' })
    else if (last?.kind === 'text') last.blocks.push(block)
    else runs.push({ kind: 'text', blocks: [block], afterMedia: last?.kind === 'media' })
  }
  // The label heads the lead, wherever it falls (after an opening image, say). Without a lead the
  // section still opens on its label, even when its first block is an image.
  const leadRun = runs.find((run) => run.kind === 'text' && run.blocks.some((block) => block.kind === 'lead'))
  if (!leadRun && (runs[0]?.kind !== 'text' || runs[0].afterMedia)) runs.unshift({ kind: 'text', blocks: [], afterMedia: false })
  // The academic slug says where the work was done, so it goes above the section's label.
  const slug = runs.findIndex((run) => run.kind === 'wide' && run.block.name === 'academic')
  if (slug > 0) runs.unshift(...runs.splice(slug, 1))

  const opening = leadRun ?? runs.find((run) => run.kind === 'text')
  const copy = (blocks: SectionBlock[]) => blocks.map((block, j) => <TextBlock key={j} block={block} />)
  return (
    <section id={section.id} className="study-section study-section--v2">
      {runs.map((run, i) => {
        switch (run.kind) {
          case 'text':
            return (
              <div key={i} className={`sv-text${run.afterMedia ? ' sv-text--after' : ''}`}>
                {run === opening && <h2 className="sv-label">{section.title}</h2>}
                {copy(run.blocks)}
              </div>
            )
          case 'statement':
            return <Statement key={i} html={run.html} />
          case 'feature':
            return <Feature key={i}>{copy(run.blocks)}</Feature>
          case 'impact':
            return <Impact key={i} blocks={run.blocks} />
          case 'panel':
            return (
              <Feature key={i} className={`sv-panel sv-panel--${run.variant}`}>
                {run.intro.length > 0 && <div className="sv-panel-intro">{copy(run.intro)}</div>}
                {run.block.kind === 'code' ? (
                  <CodeBlock text={run.block.text} lang={run.block.lang} file={run.block.file} still />
                ) : (
                  <TextBlock block={run.block} />
                )}
              </Feature>
            )
          case 'media':
            return (
              <div key={i} className="sv-media">
                <V2Figures row={run.row} className="sv-figure" />
              </div>
            )
          case 'half':
            return (
              <div key={i} className={`sv-half${run.row.right ? ' sv-half--right' : ''}`}>
                <div className="sv-half-media">
                  <MediaBlock src={run.row.images[0].src} still={run.row.still} className={run.row.clear ? 'media--clear' : ''} />
                </div>
                <div className="sv-half-copy">
                  {copy(run.blocks)}
                  {run.row.images[0].alt && <p className="sv-note">{run.row.images[0].alt}</p>}
                </div>
              </div>
            )
          case 'sticky':
            return (
              <div key={i} className={`sv-sticky${run.row.right ? ' sv-sticky--right' : ''}`}>
                <div className="sv-sticky-media">
                  <V2Figures row={run.row} className="sv-figure" />
                </div>
                <div className="sv-sticky-copy">{copy(run.blocks)}</div>
              </div>
            )
          case 'wide':
            return (
              <div key={i} className="study-proto sv-wide">
                <Prototype name={run.block.name} content={run.block.content} />
                {run.block.aside && <p className="sv-note" dangerouslySetInnerHTML={{ __html: run.block.aside }} />}
              </div>
            )
        }
      })}
    </section>
  )
}

/**
 * A dark panel, set like a drawing sheet (SheetMarks), for a statement list and its button, or
 * (with a `className`) audio tracks or code and their intro. Its contents pan in, one after
 * another, as the panel scrolls into view and back out above it. Reduced motion shows them in place.
 */
function Feature({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const pan = gsap.from(gsap.utils.selector(root)('.sv-feature-copy > *'), {
          y: 40,
          autoAlpha: 0,
          stagger: 0.12,
          paused: true,
        })
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          onEnter: () => pan.timeScale(1).play(),
          onLeaveBack: () => pan.timeScale(1.6).reverse(),
        })
      })
    },
    { scope: root },
  )
  return (
    <div ref={root} className={`sv-feature ${className}`.trim()}>
      <div className="sv-feature-panel">
        <SheetMarks />
        <div className="sv-feature-copy">{children}</div>
      </div>
    </div>
  )
}

/**
 * A paragraph that's only a highlight, given room: large, in the display weight, its words filling
 * in from grey to ink as it scrolls up the page (scrubbed, so they empty again going back up).
 * Reduced motion shows it inked.
 */
function Statement({ html }: { html: string }) {
  const root = useRef<HTMLParagraphElement>(null)
  const words = html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .split(/\s+/)
    .filter(Boolean)
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(gsap.utils.selector(root)('.sv-statement-word'), {
          opacity: 0.18,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'bottom 50%', scrub: 0.5 },
        })
      })
    },
    { scope: root },
  )
  return (
    <p ref={root} className="sv-statement">
      {words.map((word, i) => (
        <span key={i} className="sv-statement-word">
          {word}{' '}
        </span>
      ))}
    </p>
  )
}

/**
 * A stat's figure split for counting: "5,400" -> 5400, "4 days" -> 4 and " days", "76.4%" -> 76.4
 * (one decimal place) and "%", "~500" -> "~" and 500.
 */
const figure = (value: string) => {
  const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value.trim())
  if (!match) return null
  const [, prefix, digits, unit] = match
  return { prefix, n: Number(digits.replace(/,/g, '')), places: digits.split('.')[1]?.length ?? 0, unit }
}
const formatFigure = (n: number, places: number) => n.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places })

/**
 * Stats on the statement lists' dark drawing sheet: the subheading that introduces them in light
 * ink, then the figures in the display type, large, across the whole panel, each counting up from
 * zero as the panel scrolls into view (and back down above it). A button follows beneath.
 * Reduced motion shows the figures as written.
 */
function Impact({ blocks }: { blocks: SectionBlock[] }) {
  const root = useRef<HTMLDivElement>(null)
  const heading = blocks.find((block) => block.kind === 'subheading')
  const stats = blocks.find((block) => block.kind === 'prototype' && block.name === 'stats')
  const rest = blocks.filter((block) => block !== heading && block !== stats)
  const rows = stats?.kind === 'prototype' ? stats.content.split('\n').map((line) => line.split('|').map((part) => part.trim())).filter(([value]) => value) : []

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const tl = gsap
          .timeline({ paused: true })
          .from(q('.sv-impact-title'), { y: 30, autoAlpha: 0, duration: 1 }, 0)
          .from(q('.sv-impact-stat'), { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1 }, 0.15)
          .from(q('.sv-impact-rule'), { scaleX: 0, transformOrigin: '0 50%', stagger: 0.12, duration: 1.2 }, 0.15)
          .from(q('.sv-impact-copy > *'), { y: 20, autoAlpha: 0, duration: 0.8 }, 0.6)
        const counters = q<HTMLElement>('.sv-impact-n')
        counters.forEach((el, i) => {
          const to = Number(el.dataset.to)
          const places = Number(el.dataset.places)
          const count = { n: 0 }
          el.textContent = '0' // each counter waits at zero for its turn
          tl.to(count, { n: to, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = formatFigure(places ? count.n : Math.round(count.n), places)) }, 0.25 + i * 0.12)
        })
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          onEnter: () => tl.timeScale(1).play(),
          onLeaveBack: () => tl.timeScale(1.6).reverse(),
        })
        // Put the written figures back if motion is turned off.
        return () => counters.forEach((el) => (el.textContent = formatFigure(Number(el.dataset.to), Number(el.dataset.places))))
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="sv-feature sv-impact">
      <div className="sv-feature-panel sv-impact-panel">
        <SheetMarks />
        {heading?.kind === 'subheading' && <h3 className="sv-impact-title" dangerouslySetInnerHTML={{ __html: heading.html }} />}
        <dl className="sv-impact-stats">
          {rows.map(([value, label], i) => {
            const fig = figure(value)
            return (
              <div key={i} className="sv-impact-stat">
                <span className="sv-impact-rule" aria-hidden="true" />
                <dd>
                  {fig ? (
                    <>
                      {fig.prefix && <span className="sv-impact-unit sv-impact-unit--prefix">{fig.prefix}</span>}
                      <span className="sv-impact-n" data-to={fig.n} data-places={fig.places}>
                        {formatFigure(fig.n, fig.places)}
                      </span>
                      {fig.unit && <span className="sv-impact-unit">{fig.unit}</span>}
                    </>
                  ) : (
                    value
                  )}
                </dd>
                <dt>{label}</dt>
              </div>
            )
          })}
        </dl>
        {rest.length > 0 && (
          <div className="sv-impact-copy">
            {rest.map((block, j) => (
              <TextBlock key={j} block={block} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TextBlock({ block }: { block: SectionBlock }) {
  switch (block.kind) {
    case 'lead':
      return <p className="study-section-lead" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'note':
      return <p className="study-section-note" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'prototype':
      return <Prototype name={block.name} content={block.content} />
    case 'subheading':
      return <h3 className="study-section-subheading" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'list':
      return <div className="study-section-list" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'paragraph':
      return <p dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'code':
      return <CodeBlock text={block.text} lang={block.lang} file={block.file} />
    case 'audio':
      return <AudioTracks tracks={block.tracks} />
    default:
      return null
  }
}
