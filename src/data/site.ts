// Films, mirroring kaelub.com/films. Thumbnails and playback come from YouTube.

export type Film = {
  title: string
  category: string
  year?: string
  description: string
  youtubeId: string
}

export const filmsIntro =
  'A collection of videography, 3D motion, and short films I’ve fully produced, exploring visual storytelling outside of traditional product design.'

export const films: Film[] = [
  { title: 'Caleb Aguiar: Demo Reel', category: 'Demo Reel', description: 'A showcase of my videography, editing, and motion design work.', youtubeId: 'iBr7-u9myAw' },
  { title: 'Advanced Interfaces Lab w/ Chris Seifert | MHCI+D Course Overview', category: 'Documentary', description: 'A course overview video for the Advanced Interfaces Lab in UW’s MHCI+D program.', youtubeId: 'JZpwuotClQ0' },
  { title: 'MHCI+D Studio Tour in Motion', category: 'Documentary', description: 'A motion tour of the MHCI+D studio space at UW.', youtubeId: 'eBoFxr2qnhQ' },
  { title: 'XBOX Arcade: Discover and Play Instantly', category: 'Product Design', description: 'A product pitch for XBOX Arcade, a cloud gaming concept built around instant matchmaking and game discovery.', youtubeId: 'oO-0QA1BzfQ' },
  { title: 'Headphones of the Future: Project Open', category: 'Product Design', description: 'A concept video exploring the interaction and design of bandless headphones.', youtubeId: '2mzSQccg3mY' },
  { title: 'Bid Day 2024!', category: 'Event Videography', year: '2024', description: 'A high-energy recap capturing the excitement of Bid Day 2024.', youtubeId: '0EFLRxWz0xE' },
  { title: 'Jekyllyde', category: 'Short Film', description: 'A short film project exploring lighting, narrative pacing, and duality.', youtubeId: 'OY9rGIfXh1I' },
  { title: 'An Introduction and my path — Live Mas Scholarship Video', category: 'Documentary', description: 'A personal documentary detailing my journey and passions.', youtubeId: 'KjhYBqqyhSk' },
  { title: 'Ethan Brown ’25 | Major Declaration Day', category: 'Documentary', description: 'Capturing a pivotal moment for a student’s academic journey.', youtubeId: 'WphwNnOQC7s' },
  { title: 'Winter 2023 Commencement Recap', category: 'Event Videography', year: '2023', description: 'A cinematic recap of the Winter 2023 graduation ceremonies.', youtubeId: 'lehaYhcnj10' },
  { title: 'HLA Short Film: TOUR (S2FM)', category: 'Short Film · Animation', description: 'A short film produced entirely within the Source 2 engine.', youtubeId: 'J305VXJf5eU' },
]

export const about = {
  portrait: 'https://media.kaelub.com/caleb-profile.jpg',
  lead: 'My name is Caleb Aguiar (Kaelub) and I’m a UX Designer with a background in Software Engineering.',
  body: [
    'Because of this molding of two subjects, my projects explore UI Design, interaction design, storytelling, artificial intelligence, web engineering, and sometimes social activism.',
    'During my freetime I either compose and produce music, practice my violin, or play video games.',
  ],
  // From Caleb_Aguiar_Resume_Multimedia.pdf.
  experience: [
    {
      role: 'Product Designer (MHCI+D Capstone)',
      org: 'Microsoft (Xbox)',
      years: 'Feb 2026 — Aug 2026',
    },
    {
      role: 'UX Designer (Intern → Contractor)',
      org: 'Trinity University',
      years: 'Dec 2024 — Aug 2026',
    },
    {
      role: 'Software Engineer Intern',
      org: 'ForeFlight, a Boeing Company',
      years: 'May 2024 — Aug 2024',
    },
    {
      role: 'Creative Producer Intern',
      org: 'Trinity University',
      years: 'May 2022 — Dec 2024',
    },
  ],
  capabilities: ['Motion design', 'Interaction design', 'Creative coding', 'Film & editing', 'Prototyping'],
  tools: ['Figma', 'After Effects', 'Cinema 4D', 'TypeScript', 'React', 'GSAP', 'Premiere Pro'],
}
