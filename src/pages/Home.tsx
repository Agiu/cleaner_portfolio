import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CaseStudyList } from '../components/CaseStudyList'
import { findCaseStudy } from '../data/caseStudies'
import { requestUnlock } from '../lib/unlockGate'

/** Work (Figma "Desktop - 4"): the case study list; its datamosh header is placed by SiteLayout. */
export function Home() {
  const navigate = useNavigate()
  const asked = (useLocation().state as { unlock?: string } | null)?.unlock

  // Sent here from a protected study's URL: ask for its password, then go on into it.
  useEffect(() => {
    const study = findCaseStudy(asked)
    if (!study) return
    navigate('/', { replace: true, state: null })
    requestUnlock(study.slug, study.title).then((ok) => ok && navigate(`/case-study/${study.slug}`))
  }, [asked, navigate])

  return <CaseStudyList />
}
