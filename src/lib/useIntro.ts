import type { RefObject } from 'react'
import { gsap, SplitText, useGSAP } from './gsap'

/** Page-load reveal: masked line rise for [data-split] text, fade-up for .intro-fade, drop-in for .back-drop. */
export function useIntro(scope: RefObject<HTMLElement>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(scope)
        const splits = q('[data-split]').map((el) => SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true }))

        const tl = gsap.timeline({ delay: 0.1 })
        splits.forEach((split, i) => {
          // 135%: the masks carry extra room for descenders (see .split-line-mask), so start lower.
          tl.from(split.lines, { yPercent: 135, duration: 1.3, stagger: 0.08 }, i * 0.12)
        })
        tl.from(q('.intro-fade'), { y: 14, autoAlpha: 0, duration: 1, stagger: 0.06 }, 0.3)
        // Go Back bars always move downwards: they drop in from above.
        tl.from(q('.back-drop'), { yPercent: -100, autoAlpha: 0, duration: 0.9, ease: 'expo.out' }, 0.2)

        return () => splits.forEach((s) => s.revert())
      })
    },
    { scope },
  )
}
