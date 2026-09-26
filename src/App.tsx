import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { SiteLayout } from './layouts/SiteLayout'
import { About } from './pages/About'
import { CaseStudyPage } from './pages/CaseStudyPage'
import { Home } from './pages/Home'
import { Play } from './pages/Play'
import { Resume } from './pages/Resume'
import { ScrollTrigger } from './lib/gsap'
import { useRouteScroll } from './lib/useRouteScroll'
import { useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  useSmoothScroll()
  useRouteScroll()

  // Web fonts shift line heights after first paint; re-measure once they land.
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/about" element={<About />} />
      </Route>
      {/* Same URLs as the live kaelub.com: /case-study/<slug> and /recruiter. */}
      <Route path="/case-study/:slug" element={<CaseStudyPage />} />
      <Route path="/recruiter" element={<Resume />} />
      {/* Paths this site used before, kept working. */}
      <Route path="/work/:slug" element={<LegacyCaseStudy />} />
      <Route path="/resume" element={<Navigate to="/recruiter" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const RENAMED_SLUGS: Record<string, string> = { 'xbox-arcade': 'xbox' }

/** Old /work/<slug> links redirect to /case-study/<slug>. */
function LegacyCaseStudy() {
  const { slug = '' } = useParams()
  return <Navigate to={`/case-study/${RENAMED_SLUGS[slug] ?? slug}`} replace />
}
