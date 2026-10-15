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
  /** Optional muted video: plays while the home card is hovered and loops on the case study hero. */
  video?: string
  /** Seconds into the video where its cover image was taken; playback starts there. */
  videoStart?: number
  /** Credit shown in the hero's bottom-right corner, for a video someone else made. */
  videoCredit?: string
  /** An animated SVG (a public path) laid over the image: it plays on its own as the case study
   *  hero, and only while hovered on the Work page card, where `image` is its still first frame. */
  animation?: string
  /** A slight drop shadow under the Work page card's text, for a hero that's bright under the title. */
  inkShadow?: boolean
  /** Arrow-link rows under the summary in the sidebar, styled like Resume and LinkedIn. */
  links?: { label: string; href: string }[]
  outcomes: string[]
  /** Empty lists hide their sidebar group. A plain name, or { name, linkedin } to link it. */
  team: (string | Advisor)[]
  advisors: Advisor[]
  /** Right-hand scrollable content, parsed from src/content/work/<slug>.md; its ## headings
   *  also become the sidebar navigation. */
  sections: CaseStudySection[]
}

// Page content lives in Markdown, one file per study, matched by slug. The sidebar details
// (title, year, summary, outcomes, team, advisors, hero) stay in this file.
const pages = import.meta.glob<string>('../content/work/*.md', { query: '?raw', import: 'default', eager: true })
const pageFor = (slug: string) => parseCaseStudy(pages[`../content/work/${slug}.md`] ?? '')

const xbox = (f: string) => `/work/xbox/${f}`
const foreflight = (f: string) => `/work/foreflight/${f}`
const audio = (f: string) => `https://media.kaelub.com/Audio/${f}`

// Xbox Arcade, ForeFlight, Project Open, Trinity University and Who Owns Seattle are adapted
// from kaelub.com.
const studies: Omit<CaseStudy, 'sections'>[] = [
  {
    slug: 'wos',
    title: 'Who Owns Seattle',
    category: 'Data Visualization',
    year: '2025',
    summary: 'A data visualizer tracing property ownership in South Lake Union, block by block, over time.',
    mediaSide: 'left',
    mediaRatio: 593 / 1090,
    image: 'https://media.kaelub.com/WOS/Cover.jpg',
    links: [{ label: 'Live Site', href: 'https://kaelub.com/who' }],
    outcomes: [
      'Built a Python and JavaScript scraper for King County’s parcel viewer, since the ownership dataset is paywalled.',
      'Automated parcel collection with Claude, turning two days of mapping South Lake Union into 30 minutes.',
      'Designed and built a working prototype: a story site and an ownership map with a scrubbable timeline, live at /who.',
    ],
    team: [],
    advisors: [],
  },
  {
    slug: 'xbox',
    title: 'Xbox Arcade',
    category: 'Product Design',
    year: '2026',
    summary:
      'A game-night decision tool that turned into a full cloud-gaming product, built with the head of design and director of research at Xbox.',
    mediaSide: 'right',
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
    category: 'Design Engineering',
    year: '2024',
    summary:
      'A summer as a software engineer intern on the debrief team, most importantly building a data-heavy system that links flight telemetry to pilots’ logbooks.',
    mediaSide: 'left',
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
    slug: 'audio',
    title: 'Project Open',
    category: 'Product Design',
    year: '2025',
    summary:
      'Project Open is an audio form factor designed to improve the shortcomings of current headphones and earphones.',
    mediaSide: 'right',
    mediaRatio: 593 / 1090,
    image: audio('image_placeholder_8.png'),
    video: 'https://media.kaelub.com/%20headphones_background_v1%20(2160p).mp4',
    outcomes: [
      'Led the main prototyping and 3D modeling for nearly 20 iterative concepts.',
      'Contributed to nearly 30 trials of user testing to adjust designs for over 94 potential ears.',
      'Developed a branding and pitch video demonstrating the headphones’ interactions.',
    ],
    team: ['Caleb Aguiar', 'Alexander Akande', 'Kaiyo Fan', 'Meera Divecha Forespring', 'Hannah Hatchett'],
    advisors: [],
  },
  {
    slug: 'trinity',
    title: 'Trinity University',
    category: 'UX Research',
    year: '2024',
    summary:
      'Recentering Trinity.edu’s school and program pages around everyone who uses the site.',
    mediaSide: 'left',
    mediaRatio: 615 / 1090,
    image: 'https://media.kaelub.com/Trinity-Redesign/Hero.jpg',
    inkShadow: true, // the title sits over the mockup's white page
    outcomes: [
      'Built five user journey maps (current student, prospective student, job applicant, alumni and donor) from interview data, to surface pain points across Trinity.edu.',
      'Developed an AI auditing agent from those journey maps that reviewed all 4,000+ pages on the site, cutting audit time by months.',
      'Led wireframes and prototypes for school, department and program pages, reordering the page hierarchy around outcomes before marketing copy.',
    ],
    team: ['Caleb Aguiar'],
    advisors: [{ name: 'Steph Enoch', role: 'Director' }],
  },
  {
    slug: 'occluded',
    title: 'Occluded Forest',
    category: 'Audio Programming',
    year: '2026',
    summary:
      'Three weeks as audio programmer on a VR forest, using sound to make a world that notices you.',
    mediaSide: 'right',
    mediaRatio: 615 / 1090,
    image: '/work/occluded/cover.jpg', // the dusk frame from Hayden's hero video
    inkShadow: true, // the title sits over pale snow
    video: 'https://media.kaelub.com/Occluded/Videohero.mp4',
    videoStart: 15.5,
    videoCredit: 'Video by Hayden Kim Dernbach',
    outcomes: [
      'Composed a lo-fi soundtrack and acknowledgement cues in Ableton, carrying as much sub-bass as the headset could take without rattling.',
      'Built trigger boxes along the mushroom path in Unity that play a one-time cue when the player finds a deer.',
      'Prototyped a head-follow script so deer turn to watch the player.',
    ],
    // Paste each teammate's LinkedIn URL in; a name links once its URL is set.
    team: [
      { name: 'Lia Chon', linkedin: 'https://www.linkedin.com/in/lia-chon/' },
      { name: 'Kaitlyn Ellington', linkedin: 'https://www.linkedin.com/in/kaitlyn-ellington/' },
      { name: 'Macks Brooks', linkedin: 'https://www.linkedin.com/in/macks-brooks-713579293/' },
      { name: 'Kiana Gregorich', linkedin: 'https://www.linkedin.com/in/kiana-gregorich-23a708221/' },
      'Caleb Aguiar',
      { name: 'Hayden Kim Dernbach', linkedin: 'https://www.linkedin.com/in/hayden-kim-dernbach-9b60772a9/' },
    ],
    advisors: [],
  },
  {
    slug: 'autotroph',
    title: 'autotroph games',
    category: 'Web Design',
    year: '2026',
    summary: 'A launch site for an indie studio’s Haunted Heist, built around players, press and creators.',
    mediaSide: 'left',
    mediaRatio: 593 / 1090,
    image: 'https://media.kaelub.com/Autotroph/autotroph.jpg',
    // The sprout, then the logo found by flashlight in the dark and knocked off by a knife, after
    // Haunted Heist.
    animation: '/work/autotroph/hero.svg',
    links: [{ label: 'Live Site', href: 'https://autotrophgames.com' }],
    outcomes: [
      'Designed and built autotroph games’ website for the launch of Haunted Heist on October 12, 2026.',
      'Gave players, press and creators each their own path: Buy now into three stores, a press kit per game, and creator key requests.',
      'Kept every word in one content file and mapped each section to Squarespace, so the studio can run the site itself.',
    ],
    team: [],
    advisors: [],
  },
]

export const caseStudies: CaseStudy[] = studies.map((study) => ({ ...study, sections: pageFor(study.slug) }))

export const findCaseStudy = (slug: string | undefined) => caseStudies.find((s) => s.slug === slug)

export const profile = {
  name: 'Caleb Aguiar',
  bio: 'A product designer working across UX design, motion, programming, and filmmaking.',
  status: 'I’m currently based in Seattle, WA and am looking for Product/UX Designer opportunities.',
  resume: 'https://media.kaelub.com/Caleb_Design_Resume.pdf',
  /** Seattle; drives the header's time-of-day colours. */
  timeZone: 'America/Los_Angeles',
  links: [
    { label: 'Linkedin', href: 'https://www.linkedin.com/in/kaelub' },
    { label: 'Github', href: 'https://github.com/Kaelubagu' },
  ],
}
