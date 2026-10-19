import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

/*
 * ForeFlight's Work page cover: the night hero (an airliner overhead in fog) as the layers it was
 * rendered from, stacked so at rest they're exactly public/work/foreflight/hero-night.jpg, the
 * case study's hero. While the card is hovered the plane flies on along its heading, drawing its
 * contrails after it, under drifting fog, its strobes blinking. Leaving plays it back to rest.
 * Without a hover (touch) or with reduced motion it simply stands still.
 */

const ART = '/work/foreflight'
/** The plane's heading across the frame (its nose points down and to the left), in % of a layer. */
const FLY = { xPercent: -5.5, yPercent: 12 }

export function ForeFlightCover() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    (_, contextSafe) => {
      gsap.matchMedia().add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const fly = gsap
          .timeline({ paused: true, defaults: { duration: 2.4, ease: 'power2.inOut' } })
          .to(q('.ff-cover-plane, .ff-cover-strobes'), { ...FLY, scale: 1.08 }, 0)
          .to(q('.ff-cover-trails'), { xPercent: FLY.xPercent * 0.7, yPercent: FLY.yPercent * 0.7, scale: 1.06 }, 0)
          .to(q('.ff-cover-fog'), { xPercent: 5, duration: 3.2 }, 0)
          .to(q('.ff-cover-sky'), { scale: 1.03, duration: 3.2 }, 0)
        // Anti-collision strobes: two quick flashes, then dark.
        const blink = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.9 })
          .to(q('.ff-cover-strobes'), { opacity: 0, duration: 0.05 })
          .to(q('.ff-cover-strobes'), { opacity: 1, duration: 0.05 }, '+=0.12')
          .to(q('.ff-cover-strobes'), { opacity: 0, duration: 0.05 }, '+=0.08')
          .to(q('.ff-cover-strobes'), { opacity: 1, duration: 0.05 }, '+=0.12')

        const card = root.current!.closest('.cs-inner, .cs-compact-link')
        if (!card || !contextSafe) return
        const enter = contextSafe(() => {
          fly.timeScale(1).play()
          blink.restart()
        })
        const leave = contextSafe(() => {
          fly.timeScale(1.4).reverse()
          blink.pause()
          gsap.to(q('.ff-cover-strobes'), { opacity: 1, duration: 0.2 })
        })
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
    <div ref={root} className="ff-cover" aria-hidden="true">
      {['sky', 'trails', 'plane', 'strobes', 'fog', 'vignette'].map((layer) => (
        <img key={layer} className={`ff-cover-${layer}`} src={`${ART}/cover-${layer}.${layer === 'sky' ? 'jpg' : 'png'}`} alt="" />
      ))}
    </div>
  )
}
