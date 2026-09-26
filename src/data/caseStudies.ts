import { parseCaseStudy, type CaseStudySection } from '../lib/caseStudyMarkdown'

export type { CaseStudySection }

export type Advisor = {
  name: string
  /** Job title, shown smaller and grey under the name. */
  role?: string
  /** LinkedIn profile URL; the name links to it when set. */
  linkedin?: string
}

export type CaseStudy = {
  slug: string
  title: string
  category: string
  year: string
  summary: string
  /** Which side of the row the visual sits on (wireframe alternates). */
  mediaSide: 'left' | 'right'
  /** Share of the row width the visual takes, from the wireframe proportions. */
  mediaRatio: number
  /** Optional cover image; falls back to a wireframe placeholder. */
  image?: string
  /** Optional muted hero video, played from a button on the case study hero. */
  video?: string
  outcomes: string[]
  /** Empty lists hide their sidebar group. */
  team: string[]
  advisors: Advisor[]
  /** Right-hand scrollable content, parsed from src/content/work/<slug>.md; its ## headings
   *  also become the sidebar navigation. */
  sections: CaseStudySection[]
}

// Page content lives in Markdown, one file per study, matched by slug. The sidebar details
// (title, year, summary, outcomes, team, advisors, hero) stay in this file.
const pages = import.meta.glob<string>('../content/work/*.md', { query: '?raw', import: 'default', eager: true })
const pageFor = (slug: string) => parseCaseStudy(pages[`../content/work/${slug}.md`] ?? '')

// Placeholder sidebar details shared by the unfinished studies until real copy lands.
function placeholderPage() {
  return {
    outcomes: [
      'A designer with a breadth across motion design, programming, and filmmaking.',
      'A designer with a breadth across motion design, programming, and filmmaking.',
      'A designer with a breadth across motion design, programming, and filmmaking.',
    ],
    team: ['Caleb Aguiar', 'Meera Divecha Forespring', 'Claude Santos'],
    advisors: [{ name: 'Caleb Aguiar' }, { name: 'Meera Divecha Forespring' }, { name: 'Claude Santos' }],
  }
}

const xbox = (f: string) => `/work/xbox/${f}`
const foreflight = (f: string) => `/work/foreflight/${f}`

// Xbox Arcade and ForeFlight are adapted from kaelub.com; the last two are still placeholders.
const studies: Omit<CaseStudy, 'sections'>[] = [
  {
    slug: 'xbox',
    title: 'Xbox Arcade',
    category: 'Product Design',
    year: '2026',
    summary:
      'A game-night decision tool that turned into a full cloud-gaming product, built with the head of design and director of research at Xbox.',
    mediaSide: 'left',
    mediaRatio: 615 / 1090,
    image: xbox('hero.jpg'),
    video: xbox('hero.mp4'), // the hook video from kaelub.com's home hero
    outcomes: [
      'Prototyped the tools that help a group decide what to play, including cards that adapt to each group and category.',
      'Set the visual direction and brought our mockups to life with animation and motion.',
      'Co-directed and produced a product pitch that fits the realm of Xbox and Discord, with funding from Netflix.',
    ],
    team: ['Caleb Aguiar', 'Clarisse Pelayo Sicat', 'Sauhee Han', 'Meera Forespring'],
    advisors: [
      { name: 'John Snavely', role: 'Head of Design, Xbox', linkedin: '' },
      { name: 'Yessenia Garcia', role: 'Technical Program Manager, Xbox', linkedin: '' },
    ],
  },
  {
    slug: 'foreflight',
    title: 'ForeFlight',
    category: 'Software Engineering',
    year: '2024',
    summary:
      'A summer as a software engineer intern on the debrief team, most importantly building a data-heavy system that links flight telemetry to pilots’ logbooks.',
    mediaSide: 'right',
    mediaRatio: 593 / 1090,
    image: foreflight('hero.jpg'),
    outcomes: [
      'Shipped bug fixes to the digital logbook and flight-plan review flows, sourced from support tickets and pilot session recordings.',
      'Led engineering on a Track Log and Logbook communication system, auto-filling flight time, route, and aircraft telemetry into an archival logbook.',
      'Partnered with product design on the review and confirm flow pilots use to approve an auto-matched entry, covering touch-and-goes, diversions, and multi-leg flights.',
    ],
    team: [],
    advisors: [
      { name: 'Jason Cooper', role: 'Engineering Manager', linkedin: '' },
      { name: 'Haley Nelson', role: 'Senior Product Designer', linkedin: '' },
      { name: 'Jeremy Miller', role: 'Staff Product Designer', linkedin: '' },
    ],
  },
  {
    slug: 'project-three',
    title: 'Project Three',
    category: 'Filmmaking',
    year: '2025',
    summary: 'A short line describing the problem, the approach, and the outcome.',
    mediaSide: 'left',
    mediaRatio: 593 / 1090,
    image: '/dummy/harbor/hero.jpg',
    ...placeholderPage(),
  },
  {
    slug: 'project-four',
    title: 'Project Four',
    category: 'Motion Design',
    year: '2024',
    summary: 'A short line describing the problem, the approach, and the outcome.',
    mediaSide: 'right',
    mediaRatio: 615 / 1090,
    image: '/dummy/calyx/hero.jpg',
    ...placeholderPage(),
  },
]

export const caseStudies: CaseStudy[] = studies.map((study) => ({ ...study, sections: pageFor(study.slug) }))

export const findCaseStudy = (slug: string | undefined) => caseStudies.find((s) => s.slug === slug)

export const profile = {
  name: 'Caleb Aguiar',
  bio: 'A designer working across product design, motion, programming, and filmmaking.',
  status: 'I’m currently based in Seattle, WA and am looking for Product/UX Designer opportunities.',
  resume: 'https://media.kaelub.com/Caleb_Design_Resume.pdf',
  /** Seattle; drives the header's time-of-day colours. */
  timeZone: 'America/Los_Angeles',
  links: [
    { label: 'Linkedin', href: 'https://www.linkedin.com/in/kaelub' },
    { label: 'Github', href: 'https://github.com/Kaelubagu' },
  ],
}
