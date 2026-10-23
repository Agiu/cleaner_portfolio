import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { UnlockModal } from './components/UnlockModal'
import { SiteLayout } from './layouts/SiteLayout'
import { About } from './pages/About'
import { CaseStudyPage } from './pages/CaseStudyPage'
import { Home } from './pages/Home'
import { Films } from './pages/Films'
import { Resume } from './pages/Resume'
import { ScrollTrigger } from './lib/gsap'
import { useRouteScroll } from './lib/useRouteScroll'
// import { useSmoothScroll } from './lib/useSmoothScroll'

export default function App() {
  // useSmoothScroll() // Lenis off for testing
  useRouteScroll()

  // Web fonts shift line heights after first paint; re-measure once they land.
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/films" element={<Films />} />
        <Route path="/about" element={<About />} />
      </Route>
      {/* Same URLs as the live kaelub.com: /case-study/<slug> and /recruiter. */}
      <Route path="/case-study/trinity" element={<Navigate to="/case-study/trinity-edu" replace />} />
      <Route path="/case-study/:slug" element={<CaseStudyPage />} />
      <Route path="/recruiter" element={<Resume />} />
      {/* Paths this site used before, kept working. */}
      <Route path="/work/:slug" element={<LegacyCaseStudy />} />
      <Route path="/play" element={<Navigate to="/films" replace />} />
      <Route path="/resume" element={<Navigate to="/recruiter" replace />} />
      {/* Who Owns Seattle is a separate prebuilt app in public/who, served at /who/. */}
      <Route path="/who" element={<LeaveForPublicApp to="/who/" />} />
      <Route path="/who/explore" element={<LeaveForPublicApp to="/who/explore/" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {/* A protected case study's password prompt, over whichever page asked for it. */}
    <UnlockModal />
    </>
  )
}

const RENAMED_SLUGS: Record<string, string> = { 'xbox-arcade': 'xbox', trinity: 'trinity-edu' }

/** Old /work/<slug> links redirect to /case-study/<slug>. */
function LegacyCaseStudy() {
  const { slug = '' } = useParams()
  return <Navigate to={`/case-study/${RENAMED_SLUGS[slug] ?? slug}`} replace />
}

/** Full page load into a prebuilt app in public/, which this router can't render. */
function LeaveForPublicApp({ to }: { to: string }) {
  useEffect(() => window.location.replace(to), [to])
  return null
}
