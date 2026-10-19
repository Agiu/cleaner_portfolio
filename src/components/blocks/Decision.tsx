import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { SheetMarks } from '../SheetMarks'

/*
 * ```decision: a turning point in the story, given its own dark sheet: the statement lists'
 * drawing-sheet panel (dot grid, a crop mark in each corner) with the line centred in the
 * display type. The line pans in as the sheet scrolls into view, and back out above it.
 */
export function Decision({ content }: { name: string; content: string }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const pan = gsap.from(gsap.utils.selector(root)('.proto-decision-text'), { y: 40, autoAlpha: 0, paused: true })
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top 75%',
          onEnter: () => pan.timeScale(1).play(),
          onLeaveBack: () => pan.timeScale(1.6).reverse(),
        })
      })
    },
    { scope: root },
  )
  return (
    <div ref={root} className="proto-decision sv-feature-panel">
      <SheetMarks />
      <p className="proto-decision-text">{content.trim()}</p>
    </div>
  )
}
