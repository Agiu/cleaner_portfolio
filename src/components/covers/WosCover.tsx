import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { TYPE_LINES, TYPE_VIEWBOX } from './wosType'

/*
 * Who Owns Seattle's Work page cover, from the Figma cover frame: the ownership map in a window
 * the same shape as the card, on the site's near-black, with WHO OWNS SEATTLE set over it in
 * white, outlined on the black and solid where it crosses the map.
 *
 * The type only shows while the card is hovered: WHO drops in from above and SEATTLE rises from
 * below, both flickering on and off, and OWNS slides in from the left, each line's letters 0.05s apart.
 * Leaving the card plays it all back out. Without a hover (touch) or with reduced motion the type
 * simply stands in place.
 */

const MAP = '/work/wos/map.jpg'
const STAGGER = 0.05
/** A switch flipped a few times: each frame the letter is simply on or off, then it stays on. */
const FLICKER_FRAMES = [0, 1, 0, 0, 1, 0, 1, 1, 0, 1]
const FLICKER_FRAME = 0.045
const flicker = () => FLICKER_FRAMES.map((on) => ({ opacity: on, duration: FLICKER_FRAME, ease: 'steps(1)' }))

const LINES = Object.entries(TYPE_LINES) as [keyof typeof TYPE_LINES, string[]][]

function Type({ variant }: { variant: 'outline' | 'fill' }) {
  return (
    <svg className={`wos-cover-type wos-cover-type--${variant}`} viewBox={TYPE_VIEWBOX}>
      {LINES.map(([line, letters]) =>
        letters.map((d, i) => <path key={`${line}${i}`} className="wos-letter" data-line={line} data-i={i} d={d} />),
      )}
    </svg>
  )
}

export function WosCover() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    (_, contextSafe) => {
      const mm = gsap.matchMedia()
      mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        // Both copies of a letter (outline and clipped fill) share its index, so they move as one.
        const stagger = (_: number, el: Element) => Number((el as SVGElement).dataset.i) * STAGGER
        const tl = gsap
          .timeline({ paused: true, defaults: { ease: 'expo.out' } })
          .fromTo(q('[data-line="who"]'), { y: -700 }, { y: 0, duration: 1.1, stagger }, 0)
          .fromTo(q('[data-line="owns"]'), { x: -900, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, stagger }, 0)
          .fromTo(q('[data-line="seattle"]'), { y: 700 }, { y: 0, duration: 1.1, stagger }, 0)

        // WHO and SEATTLE flicker on as they travel, a letter at a time.
        for (const line of ['who', 'seattle'] as const) {
          TYPE_LINES[line].forEach((_, i) => {
            const letter = q(`[data-line="${line}"][data-i="${i}"]`)
            gsap.set(letter, { opacity: 0 })
            tl.to(letter, { keyframes: flicker() }, i * STAGGER)
          })
        }

        const card = root.current!.closest('.cs-inner, .cs-compact-link')
        if (!card || !contextSafe) return
        const enter = contextSafe(() => tl.timeScale(1).play())
        const leave = contextSafe(() => tl.timeScale(1.6).reverse())
        card.addEventListener('mouseenter', enter)
        card.addEventListener('mouseleave', leave)
        return () => {
          card.removeEventListener('mouseenter', enter)
          card.removeEventListener('mouseleave', leave)
        }
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} className="wos-cover" aria-hidden="true">
      <div className="wos-cover-window">
        <img src={MAP} alt="" />
      </div>
      <Type variant="outline" />
      {/* The solid type, clipped to the window. */}
      <div className="wos-cover-fill">
        <Type variant="fill" />
      </div>
      {/* Washes up over the cover as it grows into the case study, where the hero (heroes/WosSite)
          starts on the same paper. */}
      <div className="cs-cover-wash wos-cover-wash" />
    </div>
  )
}
