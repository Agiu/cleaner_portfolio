import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

const site = (f: string) => `/work/autotroph/site/${f}.webp`
/** The Work page card's still: the crimson field and sprout this scene opens on, so the click's
 *  expand-to-hero lands on the same frame. */
const STILL = 'https://media.kaelub.com/Autotroph/autotroph.jpg'

/*
 * The autotroph games case study hero: the studio's homepage building itself inside a browser
 * window, from the real page captured layer by layer (public/work/autotroph/site, each a
 * transparent 1440 x 842 frame of the hero at 1.5x).
 *
 *   1. The card's crimson field and sprout pull back into the window's screen as the darker stage
 *      opens around it, and the window resolves.
 *   2. The site assembles: its background, the knife pattern wiping in along the blades, the crew
 *      rising into frame, the logo, the nav, the title and pitch, then Buy now.
 *   3. Then, on a loop: a cursor opens Buy now into its three stores and leaves again, while the
 *      knives drift and the window leans gently toward the pointer.
 */
export function AutotrophSite() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const screen = q('.ah-site-screen')[0] as HTMLElement
      const panel = q('.ah-site-panel')[0] as HTMLElement

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(panel, { autoAlpha: 0 })
        return
      }

      // Where the panel lands: the screen's box once the window has settled at its full size.
      const place = () => {
        const scale = gsap.getProperty(q('.ah-site-window')[0], 'scale')
        gsap.set(q('.ah-site-window'), { scale: 1 })
        const a = el.getBoundingClientRect()
        const b = screen.getBoundingClientRect()
        gsap.set(q('.ah-site-window'), { scale })
        return { left: b.left - a.left, top: b.top - a.top, width: b.width, height: b.height }
      }

      // Everything starts hidden behind the full-bleed panel.
      gsap.set(q('.ah-site-window'), { autoAlpha: 0, scale: 1.04 })
      gsap.set(q('.ah-site-layer'), { autoAlpha: 0 })
      gsap.set(panel, { left: 0, top: 0, width: '100%', height: '100%' })

      // Start once the layers are decoded, so nothing pops in half-loaded mid-move.
      const imgs = q('img') as HTMLImageElement[]
      let tl: gsap.core.Timeline | undefined
      let loop: gsap.core.Timeline | undefined
      Promise.all(imgs.map((img) => img.decode().catch(() => {}))).then(() => {
        const expo = 'expo.out'
        tl = gsap.timeline({ delay: 0.45, defaults: { ease: expo } })

        // 1. Pull back into the window.
        tl.to(panel, { ...place(), duration: 1.25, ease: 'expo.inOut' }, 0)
          .to(q('.ah-site-window'), { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'expo.inOut' }, 0.2)
          .to(q('.ah-site-glow'), { autoAlpha: 1, duration: 1.6, ease: 'sine.inOut' }, 0.3)
          // The crimson hands over to the site's own background.
          .set(q('.ah-site-bg'), { autoAlpha: 1 }, 1.0)
          .to(panel, { autoAlpha: 0, duration: 0.6, ease: 'sine.inOut' }, 1.1)

          // 2. The site assembles.
          .fromTo(q('.ah-site-knives'), { autoAlpha: 1, '--wipe': '-60%', x: -24, y: 18 }, { '--wipe': '120%', x: 0, y: 0, duration: 1.6, ease: 'power3.out' }, 1.25)
          .fromTo(q('.ah-site-crew'), { autoAlpha: 0, yPercent: 9, scale: 1.05 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.4 }, 1.45)
          .fromTo(q('.ah-site-logo'), { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.75)
          .fromTo(q('.ah-site-nav'), { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 1 }, 1.85)
          .fromTo(q('.ah-site-blurb'), { autoAlpha: 1, clipPath: 'inset(0 0 100% 0)', y: 16 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.1 }, 2.0)
          .fromTo(q('.ah-site-buy'), { autoAlpha: 0, scale: 0.92, rotate: -4 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.9 }, 2.35)

        // 3. Ambient: the knives drift along the blades, the crew breathes.
        tl.add(() => {
          gsap.to(q('.ah-site-knives'), { x: 16, y: -12, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 })
          gsap.to(q('.ah-site-crew'), { yPercent: -0.8, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        }, 3.2)

        // The cursor opens Buy now into its stores, and leaves.
        const cursor = q('.ah-site-cursor')
        const tree = q('.ah-site-buy-open')
        loop = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: tl.duration() + 0.8, defaults: { ease: 'expo.inOut' } })
        loop
          .fromTo(cursor, { autoAlpha: 0, left: '62%', top: '96%' }, { autoAlpha: 1, left: '62%', top: '96%', duration: 0.3, ease: 'sine.out' })
          .to(cursor, { left: '10.5%', top: '75%', duration: 1.3 })
          .to(cursor, { scale: 0.86, duration: 0.12, ease: 'power2.in' })
          .to(cursor, { scale: 1, duration: 0.25, ease: 'power2.out' })
          // The button flips to its open state at once (the frame up to x 15% is just the button);
          // the store branch then grows out along its line.
          .set(q('.ah-site-buy'), { autoAlpha: 0 }, '<-0.25')
          // (Not rendered up front: its start state would show the open button during the intro.)
          .fromTo(tree, { autoAlpha: 1, clipPath: 'inset(0 85% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out', immediateRender: false }, '<')
          .to(cursor, { left: '20%', top: '79.5%', duration: 0.9 }, '+=0.3')
          .to(cursor, { left: '70%', top: '104%', autoAlpha: 0, duration: 1.3 }, '+=1.4')
          .to(tree, { clipPath: 'inset(0 85% 0 0)', duration: 0.6, ease: 'expo.in' }, '<0.2')
          .set(tree, { autoAlpha: 0 })
          .set(q('.ah-site-buy'), { autoAlpha: 1 })
      })

      // The window leans a few degrees toward the pointer, for depth.
      const win = q('.ah-site-window')[0]
      const rx = gsap.quickTo(win, 'rotationX', { duration: 1.2, ease: 'power3.out' })
      const ry = gsap.quickTo(win, 'rotationY', { duration: 1.2, ease: 'power3.out' })
      const lean = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        ry(((e.clientX - r.left) / r.width - 0.5) * 6)
        rx(-((e.clientY - r.top) / r.height - 0.5) * 4)
      }
      const settle = () => {
        rx(0)
        ry(0)
      }
      el.addEventListener('pointermove', lean)
      el.addEventListener('pointerleave', settle)
      return () => {
        tl?.kill()
        loop?.kill()
        el.removeEventListener('pointermove', lean)
        el.removeEventListener('pointerleave', settle)
      }
    },
    { scope: root },
  )

  const layer = (name: string, file = name) => <img className={`ah-site-layer ah-site-${name}`} src={site(file)} alt="" draggable={false} />

  return (
    <div ref={root} className="ah-site" aria-hidden="true">
      <div className="ah-site-glow" />
      <div className="ah-site-stage">
        <div className="ah-site-window">
          <div className="ah-site-bar">
            <span className="ah-site-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="ah-site-url">autotrophgames.com</span>
          </div>
          <div className="ah-site-screen">
            {layer('bg')}
            {layer('knives')}
            {layer('logo')}
            {layer('crew')}
            {layer('nav')}
            {layer('blurb')}
            {layer('buy')}
            {layer('buy-open')}
            <svg className="ah-site-cursor" viewBox="0 0 24 24" width="24" height="24">
              <path d="M5 2.5v17.2l4.6-4.4 3 6.6 2.6-1.2-3-6.5h6.3z" fill="#fff" stroke="#05070f" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <img className="ah-site-panel" src={STILL} alt="" draggable={false} />
    </div>
  )
}
