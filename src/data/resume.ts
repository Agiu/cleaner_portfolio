// The /recruiter page: every position, what it changed, and a picture of it.
// Migrated from the old portfolio's recruiter page (ProdDesign_Portfolio/content/recruiter.ts).

export type ResumeLink = {
  label: string
  /** Internal routes start with "/", everything else opens in a new tab. */
  href: string
}

export type Impact = {
  headline: string
  detail?: string
  links?: ResumeLink[]
}

export type Shot = {
  /** Empty with `nda` set renders the "Under NDA" plate instead of an image. */
  src: string
  alt: string
  caption?: string
  nda?: boolean
}

export type Position = {
  id: string
  org: string
  /** Sidebar nav label, for the entries that share an org. */
  navLabel?: string
  title: string
  logo?: string
  months?: number
  period?: string
  place?: string
  kind?: 'role' | 'education'
  summary: string
  impacts: Impact[]
  shots: Shot[]
  links?: ResumeLink[]
}

/** "7 mos", "1½ yrs" — how long a role ran. */
export const duration = (months: number) => {
  if (months < 12) return `${months} mo${months === 1 ? '' : 's'}`
  const years = Math.round((months / 12) * 2) / 2
  const half = years % 1 !== 0
  return `${Math.floor(years)}${half ? '½' : ''} ${years === 1 ? 'yr' : 'yrs'}`
}

export const greeting = {
  /** Rotates after "Hi,". Kept to single words so each fits the sidebar at display size. */
  salutations: ['Recruiter', 'Scouter', 'Onlooker', 'Observer'],
  intro:
    'I use this page to go into more depth than LinkedIn allows, especially on the impact of each project. If you want more than the bullet points, this is where to look.',
  email: 'kaelub.tech@gmail.com',
  pdf: 'https://media.kaelub.com/Caleb_Design_Resume.pdf',
}

export const positions: Position[] = [
  {
    id: 'microsoft',
    org: 'Microsoft (UW MHCI+D Capstone)',
    logo: '/logos/microsoft.svg',
    title: 'Product Designer',
    months: 7,
    period: 'Feb 2026 – Aug 2026',
    place: 'Remote',
    summary:
      'Developed a seven-month long project with Xbox on what a cloud gaming nook could be: a shared surface where a friend group discovers, decides, and drops into a game together.',
    impacts: [
      {
        headline: 'Led prototyping and strategy on the two features the concept rests on',
        detail:
          'An immediate group decision-making tool that collapses the negotiation into one shared moment, and adaptive information cards that change what they surface depending on who is in the group.',
      },
      {
        headline: 'Owned art direction and motion for the prototype',
        detail:
          'Set the hi-fi visual direction and built the motion design in, so the flows read as a product rather than a sequence of screens.',
      },
      {
        headline: 'Co-directed and fully produced the product pitch video',
        detail:
          'Using Adobe Premiere Pro & After Effects, I color graded, foley’d, and did the motion graphics for this entire video.',
        links: [{ label: 'View Video', href: 'https://youtu.be/oO-0QA1BzfQ' }],
      },
    ],
    shots: [
      {
        src: 'https://media.kaelub.com/Xbox/Xbox_casestudy_hero1.jpg',
        alt: 'Xbox Arcade, a cloud gaming nook built around group discovery',
        caption: 'Xbox Arcade, the cloud gaming nook',
      },
      {
        src: 'https://media.kaelub.com/Xbox/ex3.jpg',
        alt: 'Ranking, Spin the Wheel, and social proof tools surfaced together in Arcade',
        caption: 'Ranking, the Wheel, and social proof, working together',
      },
    ],
    links: [{ label: 'Read case study', href: '/case-study/xbox' }],
  },
  {
    id: 'uw',
    org: 'University of Washington',
    logo: '/logos/washington.svg',
    title: 'Masters Student and Videographer for MHCI+D',
    period: 'Sept 2025 – Aug 2026',
    place: 'Seattle, WA',
    kind: 'education',
    summary:
      'A team of people and I pushed the online aesthetic presence of the program forward; I gave a few lectures about storytelling and multimedia as well as created initiatives to bring designers closer to the codebase. I also developed some pretty data heavy apps while completing this masters program.',
    impacts: [
      {
        headline: 'Formed an AI first initiative for prototyping',
        detail:
          'I created a weekly event called Vibe-Time to help designers get closer to the codebase and get used to on-the-fly prototyping using frontier models. I had more than half the cohort come to the vibe-time program, which was awesome.',
      },
      {
        headline: 'Became a lecturer',
        detail:
          'I created a few skill-shareout-lectures for multimedia foundations and camerawork so the cohort could increase their storytelling abilities. I spoke for an hour and a half straight about videos, cameras, framing, cinematography, and editing for at least one of the lectures.',
      },
      {
        headline: 'Building Who Owns Seattle, a property-ownership data visualizer',
        detail:
          'Traces how downtown Seattle changed hands over time using King County’s public records; still being created.',
      },
      {
        headline: 'Designed and led Project Open: open-back headphones for urban use',
        detail:
          'Designed and prototyped comfortable headphones by user testing over 30 times to fit designs across more than 90 potential ears, and shot + edited the pitch video for it.',
        links: [{ label: 'View Video', href: 'https://youtu.be/2mzSQccg3mY' }],
      },
      {
        headline: 'Designed, programmed, and built a walk-up-and-play minigolf hole',
        detail:
          'Physical structure and player interactions, driven by multiple Adafruit CPXs, a collaborative course two people play at once.',
      },
    ],
    shots: [
      {
        src: 'https://media.kaelub.com/vibe-time.jpeg',
        alt: 'The MHCI+D cohort gathered around a table full of laptops at Vibe-Time, the weekly AI-prototyping meetup',
        caption: 'Vibe-Time, the weekly AI-prototyping meetup',
      },
      {
        src: 'https://media.kaelub.com/Lecture.jpg',
        alt: 'Caleb presenting a slide titled "Caleb’s Video Editing Workshop" to the cohort',
        caption: 'One of the multimedia lectures for the cohort',
      },
      {
        src: 'https://media.kaelub.com/WOS/2.png',
        alt: 'Who Owns Seattle, a color-coded 3D map of South Lake Union parcels by owner',
        caption: 'Who Owns Seattle, the ownership map',
      },
      {
        src: 'https://media.kaelub.com/Audio/headphone_render.jpg',
        alt: 'Project Open, a render of the bandless headphone form factor',
        caption: 'Project Open, the bandless form factor',
      },
      {
        src: 'https://media.kaelub.com/Minigolf/1.png',
        alt: 'The finished collaborative minigolf hole',
        caption: 'Draw Together, the finished hole',
      },
    ],
  },
  {
    id: 'trinity-ux',
    org: 'Trinity University',
    navLabel: 'Trinity (UX)',
    logo: '/logos/trinity.svg',
    title: 'UX Designer Contractor',
    months: 18,
    place: 'San Antonio, TX',
    summary:
      'I was Trinity’s in-house UX designer for the web team. I helped reimagine the search experience; the school, department, and program pages. Which proactively assisted a larger redesign project later in the year.',
    impacts: [
      {
        headline: 'Redesigned the university’s search experience for SearchStax',
        detail:
          'Brought in to rebuild the searching suite on top of the new platform, the shortcut students reach for when the navigation fails them.',
        links: [
          {
            label: 'View Designs for Trinity Search',
            href: 'https://www.figma.com/design/GXBBaodKgwj4SOgDDWU8sz/Trinity-Design-Work?node-id=8-144',
          },
        ],
      },
      {
        headline: 'Rebuilt school, department, and program templates around the end user',
        detail:
          'Reconfigured navigation for the prospective students who turned out to be most of the traffic, while holding consistency with the rest of Trinity.edu.',
      },
      {
        headline: 'Migrated and created content for the new design system',
        detail:
          'For the entire school redesign project, I helped with content UX, gearing most of the school’s information on its site towards prospective students instead of a generalized audience.',
      },
    ],
    shots: [
      {
        src: 'https://media.kaelub.com/Trinity-Search/Hero.jpg',
        alt: 'The redesigned Trinity University search results experience',
        caption: 'The searching suite',
      },
      {
        src: 'https://media.kaelub.com/Trinity-Redesign/Hero.jpg',
        alt: 'The Trinity.edu redesign, a school and program page template',
        caption: 'Trinity.edu school and program templates',
      },
    ],
  },
  {
    id: 'foreflight',
    org: 'ForeFlight: A Boeing Company',
    navLabel: 'ForeFlight',
    logo: '/logos/foreflight.png',
    title: 'Software Engineer Intern',
    months: 3,
    place: 'Austin, TX',
    summary:
      'Worked on the debriefing team to ensure the desktop version of the mobile app worked seamlessly with private pilots’ track logs and logbooks.',
    impacts: [
      {
        headline: 'Built a bridge between two data-heavy systems',
        detail:
          'I designed and built frontend features for a pilot debriefing system between logbooks and track logs on the desktop app. This allowed pilots to easily organize their dense flight information into a simple archive.',
      },
      {
        headline: 'Shipped over 3000+ lines of code',
        detail:
          'From the project I worked on, bug fixes, and quality of life nuggets I added in their systems; I added over 3000 lines of code.',
      },
    ],
    shots: [{ src: '', alt: '', nda: true }],
    links: [{ label: 'Read case study', href: '/case-study/foreflight' }],
  },
  {
    id: 'spend-with-us',
    org: 'Spend With Us',
    logo: '/logos/spendwithus.png',
    title: 'Software Development Intern',
    months: 5,
    place: 'Sydney, NSW, Australia',
    summary:
      'I continued work on an online store vendor created to help local Australian bush businesses that were affected by major bush fires during COVID.',
    impacts: [
      {
        headline: 'Started scaffolding on a new Artisan Website for luxury goods',
        detail:
          'Near the end of the internship the CEO wanted me to start developing an Artisan Website. I built it in a couple days by using WordPress and its own backend system.',
      },
      {
        headline: 'Reduced site loading time by 6 seconds',
        detail:
          'Through a few PHP injections and alterations to how image content is populated throughout the site, I brought the site loading times from 10 seconds to about 4 seconds.',
      },
    ],
    shots: [],
  },
  {
    id: 'trinity-video',
    org: 'Trinity University',
    navLabel: 'Trinity (Video)',
    logo: '/logos/trinity.svg',
    title: 'Creative Producer Intern',
    months: 32,
    place: 'San Antonio, TX',
    summary:
      'The university’s video work: commencement and event recaps, student documentaries, and recruitment films, shot, cut, and colored in house.',
    impacts: [
      {
        headline: 'Won three Viddy Awards for videos I’ve created',
        detail:
          'From my time at the Strategic Communications Department, as an intern, I brought in a few awards for the entire team.',
        links: [
          {
            label: 'See the announcement',
            href: 'https://www.linkedin.com/posts/kaelub_trinity-university-strategic-communications-activity-7183345371073449984--zMM',
          },
        ],
      },
      {
        headline: 'Produced event, documentary, and recruitment videos for the university',
        detail:
          'Commencement recaps, Bid Day, and student profiles, all shot and edited end to end on the university’s own channels.',
      },
      {
        headline: 'Created content that reached an audience of over 300,000+ people by being as organic as possible',
        detail:
          'I produced and composed music for a set of vignettes which were very raw compared to a normal university’s marketing polishing. These videos were cinematic yet very in depth about 5 students’ journeys in reaching their picked major.',
        links: [
          {
            label: 'Watch Major Declaration Day',
            href: 'https://www.youtube.com/watch?v=pED6xhw1aOc&list=PL63oJnhgV-LLsFsGanNIZCVyKzZ5SIWNZ&index=3',
          },
        ],
      },
    ],
    shots: [],
  },
  {
    id: 'trinity-cs',
    org: 'Trinity University',
    navLabel: 'Trinity (B.S. CS)',
    logo: '/logos/trinity.svg',
    title: 'B.S. Computer Science · Cum Laude',
    period: '2021 – 2025',
    place: 'San Antonio, TX',
    kind: 'education',
    summary:
      'Computer science, with a study-abroad term at the University of Sydney on virtual reality and HCI. This is where the engineering half of the work comes from.',
    impacts: [],
    shots: [],
  },
]
