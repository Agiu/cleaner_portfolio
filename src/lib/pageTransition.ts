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

  // A More Work card (a MediaBlock) is hover-zoomed through CSS; note how far, so the clone can
  // ease out of it rather than snap.
  const zoom = Number(gsap.getProperty(media.querySelector('img, video') ?? media, 'scaleX')) || 1

  overlay = document.createElement('div')
  overlay.className = 'expand-overlay'
  const clone = media.cloneNode(true) as HTMLElement
  clone.removeAttribute('style') // drop reveal clip-path/opacity; the overlay handles its own shape
  clone.classList.remove('cs-compact-media') // and the card's aspect ratio and hover zoom
  overlay.appendChild(clone)
  document.body.appendChild(overlay)
  // An inlined card animation (CaseStudyCompact) would restart in the copy; hold it on its
  // first frame instead, where the hero's own copy starts.
  clone.getAnimations({ subtree: true }).forEach((a) => {
    a.pause()
    a.currentTime = 0
  })
  // A hover-playing video moves into the overlay as-is (a copy would restart from black), and
  // keeps playing as it grows.
  const live = media.querySelector('video')
  const copy = clone.querySelector('video')
  if (live && copy) {
    copy.replaceWith(live)
    live.play().catch(() => {})
  }

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

    // Grow into the case study's hero slot: right of the sidebar, filling the full-width frame and
    // running to the bottom of the window, same as .study-hero, so the overlay lands at exactly the
    // size the real hero renders at underneath.
    const frame = document.getElementById('root')!.getBoundingClientRect()
    const heroWidth = frame.width - sidebar
    const heroHeight = window.innerHeight
    // The hero's scrubbed parallax (MediaBlock) runs from "top bottom" to "bottom top", so at scroll 0
    // it sits at this progress, not the midpoint (only equal when the hero is a full viewport tall).
    const heroProgress = window.innerHeight / (window.innerHeight + heroHeight)

    tl.to(overlay, { left: frame.left + sidebar, top: 0, width: heroWidth, height: heroHeight, borderRadius: 0 }, 0)
      // Settle the inner layers to the hero's resting state (no hover zoom, its scroll-0 parallax).
      // Main rows have .cs-* layers; More Work cards are a MediaBlock, the same as the hero.
      .to(clone.querySelectorAll('.cs-hover, .cs-media-scale, .media-scale'), { scale: 1 }, 0)
      // The clone's copied transform parses as px, so zero y and drive yPercent (MediaBlock: -7 -> 7).
      .to(clone.querySelector('.cs-parallax, .media-parallax'), { y: 0, yPercent: -7 + 14 * heroProgress }, 0)
      // A More Work card's title and summary come off the image as it grows.
      .to(clone.querySelector('.cs-compact-info'), { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
    if (zoom !== 1) tl.fromTo(clone.querySelectorAll('img, video'), { scale: zoom }, { scale: 1 }, 0)

    // A built cover (covers/) can wash out to its hero's ground as it grows, handing off to it.
    const wash = clone.querySelector('.cs-cover-wash')
    if (wash) tl.to(wash, { autoAlpha: 1, duration: 0.8, ease: 'power2.inOut' }, 0.1)

    // Placeholder-only mock-up card (absent once a real image is set).
    const float = clone.querySelector('.cs-float')
    if (float) {
      tl.to(float, { y: 60 - 120 * heroProgress }, 0).to(clone.querySelector('.cs-float-hover'), { y: 0, width: '42%' }, 0)
    }

    // Clear the rest of the home page out of the way while it grows.
    if (pageRoot) {
      const q = gsap.utils.selector(pageRoot)
      tl.to(q('.sidebar--home > *, .site-header, .cs, .cs-more, .cursor'), { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, 0)
        .to(q('.sidebar--home'), { backgroundColor: '#ffffff', duration: 0.8, ease: 'power2.inOut' }, 0.1)
    }
  })
}

/**
 * Leave for a page outside this app (a prebuilt site in public/, like /who): the window fades to
 * `color` (the other site's ground), then the browser loads it. Coming back with the browser's
 * back button (a page restored from its cache) clears the fade.
 */
export function fadeToSite(href: string, color: string) {
  const veil = document.createElement('div')
  veil.className = 'site-veil'
  veil.style.background = color
  document.body.appendChild(veil)
  const clear = (e: PageTransitionEvent) => {
    if (!e.persisted) return
    veil.remove()
    window.removeEventListener('pageshow', clear)
  }
  window.addEventListener('pageshow', clear)
  const go = () => window.location.assign(href)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
  gsap.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: 'power2.inOut', onComplete: go })
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
