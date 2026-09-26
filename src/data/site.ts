// Placeholder content for the Play and About pages — swap in real work and copy.
// Play imagery reuses the dummy shots borrowed from uwdesignshow.com (public/dummy).

export type PlayItem = {
  title: string
  medium: string
  year: string
  image: string
  /** Frame shape in the grid. */
  shape: 'tall' | 'wide'
}

export const playItems: PlayItem[] = [
  { title: 'Experiment 01', medium: 'Motion study', year: '2026', image: '/dummy/everwarm/vertical-1.jpg', shape: 'tall' },
  { title: 'Experiment 02', medium: 'Creative code', year: '2026', image: '/dummy/harbor/detail-2.jpg', shape: 'wide' },
  { title: 'Experiment 03', medium: 'Short film', year: '2025', image: '/dummy/calyx/detail-3.jpg', shape: 'wide' },
  { title: 'Experiment 04', medium: 'Type study', year: '2025', image: '/dummy/aspi/vertical-1.jpg', shape: 'tall' },
  { title: 'Experiment 05', medium: 'Motion study', year: '2025', image: '/dummy/everwarm/detail-3.jpg', shape: 'wide' },
  { title: 'Experiment 06', medium: 'Creative code', year: '2024', image: '/dummy/calyx/vertical-1.jpg', shape: 'tall' },
  { title: 'Experiment 07', medium: 'Short film', year: '2024', image: '/dummy/harbor/detail-4.jpg', shape: 'wide' },
  { title: 'Experiment 08', medium: 'Type study', year: '2024', image: '/dummy/aspi/detail-3.jpg', shape: 'wide' },
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
