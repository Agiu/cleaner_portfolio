import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from './gsap'
import { scrollToTarget } from './useSmoothScroll'

// Last scroll position per path, so "Go Back" lands where you left the list.
const positions = new Map<string, number>()
// Pages that always open at the top instead of where you left them.
const ALWAYS_TOP = new Set(['/recruiter'])

export function useRouteScroll() {
  const { pathname } = useLocation()
  const current = useRef(pathname)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const save = () => positions.set(current.current, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [])

  useLayoutEffect(() => {
    current.current = pathname
    scrollToTarget(ALWAYS_TOP.has(pathname) ? 0 : (positions.get(pathname) ?? 0), { immediate: true })
    ScrollTrigger.refresh()
  }, [pathname])
}
