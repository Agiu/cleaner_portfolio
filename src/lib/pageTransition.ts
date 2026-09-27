import { gsap } from './gsap'
import { getLenis } from './useSmoothScroll'

let overlay: HTMLDivElement | null = null

/** True when the expanding-image transition should run (desktop, motion allowed). */
export const canExpand = () =>
  window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)').matches

/**
 * Lifts a home card's image into a fixed overlay and grows it to fill the
 * right-hand column, exactly where the case study hero sits. The overlay lives
 * on <body> so it survives the route change; the case study page calls
 * finishExpand() once its hero is mounted underneath.
 */
export function expandToHero(media: HTMLElement, pageRoot: HTMLElement | null): Promise<void> {
  finishExpand(true)
  const rect = media.getBoundingClientRect()
  const sidebar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')) || 292

  overlay = document.createElement('div')
  overlay.className = 'expand-overlay'
  const clone = media.cloneNode(true) as HTMLElement
  clone.removeAttribute('style') // drop reveal clip-path/opacity; the overlay handles its own shape
  overlay.appendChild(clone)
  document.body.appendChild(overlay)

  gsap.set(overlay, { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
  gsap.set(media, { autoAlpha: 0 }) // the overlay stands in for it

  getLenis()?.stop()

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut', duration: 1.1 },
      onComplete: () => {
        getLenis()?.start()
        resolve()
      },
    })

    // Grow into the case study's hero slot: right of the sidebar, filling the full-width frame.
    // Same 16:9-capped shape as .study-hero (aspect-ratio + max-height), so the overlay lands at
    // exactly the size the real hero renders at underneath.
    const frame = document.getElementById('root')!.getBoundingClientRect()
    const heroWidth = frame.width - sidebar
    const heroHeight = Math.min((heroWidth * 9) / 16, window.innerHeight)
    tl.to(overlay, { left: frame.left + sidebar, top: 0, width: heroWidth, height: heroHeight }, 0)
      // Settle the inner layers to the hero's resting state (no hover zoom, neutral parallax).
      .to(clone.querySelectorAll('.cs-hover, .cs-media-scale'), { scale: 1 }, 0)
      // The clone's copied transform parses as px, so zero both units to reach the hero's neutral parallax.
      .to(clone.querySelector('.cs-parallax'), { y: 0, yPercent: 0 }, 0)

    // Placeholder-only mock-up card (absent once a real image is set).
    const float = clone.querySelector('.cs-float')
    if (float) {
      tl.to(float, { y: 0 }, 0).to(clone.querySelector('.cs-float-hover'), { y: 0, width: '42%' }, 0)
    }

    // Clear the rest of the home page out of the way while it grows.
    if (pageRoot) {
      const q = gsap.utils.selector(pageRoot)
      tl.to(q('.sidebar--home > *, .site-header, .cs, .cursor'), { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, 0)
        .to(q('.sidebar--home'), { backgroundColor: '#ffffff', duration: 0.8, ease: 'power2.inOut' }, 0.1)
    }
  })
}

/** Fade the overlay off once the real hero is in place underneath. */
export function finishExpand(immediate = false) {
  const el = overlay
  if (!el) return
  overlay = null
  if (immediate) {
    el.remove()
    return
  }
  gsap.to(el, { autoAlpha: 0, duration: 0.35, delay: 0.05, ease: 'power1.out', onComplete: () => el.remove() })
}

/** Fade a whole page out before a route change. Resolves immediately under reduced motion. */
export function fadeOutPage(page: HTMLElement | null): Promise<void> {
  if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.to(page, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut', onComplete: resolve })
  })
}

/** Fade a freshly mounted page in (pair with fadeOutPage on the page being left). */
export function fadeInPage(page: HTMLElement | null) {
  if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  gsap.fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' })
}
