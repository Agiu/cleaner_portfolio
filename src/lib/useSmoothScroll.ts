import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from './gsap'

let instance: Lenis | null = null

/** The active Lenis instance, or null when smooth scroll is off (reduced motion). */
export const getLenis = () => instance

/** Scroll to an element or position, smoothly when Lenis is running. */
export function scrollToTarget(target: HTMLElement | number, opts: { immediate?: boolean } = {}) {
  if (instance) {
    instance.scrollTo(target, {
      immediate: opts.immediate,
      duration: 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    })
    return
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: opts.immediate ? 'instant' : 'smooth' })
}

/**
 * Lenis drives the scroll position; GSAP's ticker drives Lenis. Running both
 * off the same RAF keeps scrubbed ScrollTriggers perfectly in phase with the
 * smoothed scroll, which is what removes the jitter you get when they tick
 * independently.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    instance = lenis

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      instance = null
    }
  }, [])
}
