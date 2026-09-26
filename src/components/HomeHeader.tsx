import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useTimeOfDay } from '../lib/timeOfDay'
import { scrollToTarget } from '../lib/useSmoothScroll'
import { createReel, STILL_TIME } from '../lib/workReel'

/*
 * Home header: a looping motion-graphic reel of the work (see lib/workReel.ts), coloured by
 * the time of day in Seattle, with a soft glow behind it that's lit by whatever is on screen.
 */

/** How strong the halo behind the header is. */
const GLOW_OPACITY = 0.7

// Kept outside the component so a remount (React's dev double-mount, or coming back to Work)
// continues the reel where it was instead of restarting it and replaying the entrance.
let reelClock = 0
let entrancePlayed = false

/**
 * Turns the glow into light rather than shadow: each pixel's alpha follows its brightness, so
 * dark areas of the header emit nothing (the page stays pure white there) and only the lit,
 * coloured linework bleeds out. Runs on a 48x16 copy, so it's a few hundred pixels a frame.
 */
function lightOnly(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2]
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    // Near-black emits nothing; ramps to full by ~55% brightness.
    const a = Math.min(1, Math.max(0, (luma - 0.12) / 0.43))
    // Light, never shadow: push the colour to full brightness, keeping its hue. Dim greys (white
    // text averaged with the dark ground) become white and vanish into the page; dim orange
    // becomes orange light.
    const peak = Math.max(r, g, b, 1)
    d[i] = (r / peak) * 255
    d[i + 1] = (g / peak) * 255
    d[i + 2] = (b / peak) * 255
    d[i + 3] = Math.round(Math.pow(a, 1.3) * 255)
  }
  ctx.putImageData(img, 0, 0)
}

export function HomeHeader() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const glow = useRef<HTMLCanvasElement>(null)
  const tod = useTimeOfDay()
  // Read by the render loop every frame; updated whenever the time-of-day palette ticks over.
  const palette = useRef(tod.palette)
  palette.current = tod.palette
  const slugNow = useRef<() => string | undefined>(() => undefined)

  // The reel is a way in: clicking it goes to the case study on screen, or to the list.
  const goToWork = () => {
    const slug = slugNow.current()
    const target =
      (slug && document.querySelector<HTMLElement>(`.cs[data-slug="${slug}"]`)) || document.querySelector<HTMLElement>('.cs-list')
    if (target) scrollToTarget(target)
  }

  useGSAP(
    () => {
      const el = root.current!
      const cv = canvas.current!
      const reel = createReel(cv)
      if (!reel) return
      slugNow.current = () => reel.currentSlug(reelClock)
      // Glow: each frame is copied into a tiny canvas behind the header, scaled up and blurred
      // in CSS, so the halo carries the reel's live colours and movement.
      const glowCv = glow.current!
      const glowCtx = glowCv.getContext('2d', { willReadFrequently: true })
      glowCv.width = 48
      glowCv.height = 16
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const pointer = { x: -9999, y: -9999 }
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        pointer.x = e.clientX - r.left
        pointer.y = e.clientY - r.top
      }
      const onLeave = () => {
        pointer.x = pointer.y = -9999
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)

      const render = () => {
        reel.draw(reelClock, palette.current, pointer)
        if (glowCtx) {
          glowCtx.clearRect(0, 0, glowCv.width, glowCv.height)
          glowCtx.drawImage(cv, 0, 0, glowCv.width, glowCv.height)
          lightOnly(glowCtx, glowCv.width, glowCv.height)
        }
      }

      const resize = () => {
        const r = el.getBoundingClientRect()
        reel.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2))
        render()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(el)
      // Labels are canvas text: redraw once the web font is in.
      document.fonts.ready.then(render)

      const teardown = () => {
        ro.disconnect()
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }

      if (reduce) {
        // One settled frame, no motion.
        reelClock = STILL_TIME
        render()
        gsap.set(el, { autoAlpha: 1 })
        gsap.set(glowCv, { autoAlpha: GLOW_OPACITY })
        return teardown
      }

      // Share GSAP's ticker with Lenis/ScrollTrigger; the reel's clock only runs while visible.
      let visible = true
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
      io.observe(el)

      // Background parallax: as the page scrolls, the reel drifts down at a third of the scroll
      // speed while the case studies slide up over it, and fades out. Once it's gone it stops
      // drawing; scrolling back up brings it back where it left off.
      const wrap = el.parentElement!
      let faded = false
      const drift = gsap.fromTo(
        wrap,
        { y: 0, opacity: 1 },
        {
          y: () => el.offsetHeight * 0.35,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: () => `+=${el.offsetHeight * 0.8}`,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => (faded = self.progress > 0.98),
          },
        },
      )

      const tick = (_time: number, dt: number) => {
        if (!visible || faded) return
        reelClock += Math.min(dt, 100) / 1000
        render()
      }
      gsap.ticker.add(tick)

      if (entrancePlayed) {
        gsap.set(el, { autoAlpha: 1 })
        gsap.set(glowCv, { autoAlpha: GLOW_OPACITY })
      } else {
        gsap.fromTo(
          el,
          { clipPath: 'inset(4% 4% 4% 4%)', autoAlpha: 0 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            autoAlpha: 1,
            duration: 1.4,
            delay: 0.15,
            // Only once it has actually finished: a remount that cuts it short replays it.
            onComplete: () => {
              entrancePlayed = true
            },
          },
        )
        gsap.fromTo(glowCv, { autoAlpha: 0 }, { autoAlpha: GLOW_OPACITY, duration: 1.6, delay: 0.4, ease: 'power2.out' })
      }

      return () => {
        drift.scrollTrigger?.kill()
        drift.kill()
        gsap.ticker.remove(tick)
        io.disconnect()
        teardown()
      }
    },
    { scope: root },
  )

  return (
    <div className="hh-wrap">
      <canvas ref={glow} className="hh-glow" aria-hidden="true" />
      <div
        ref={root}
        className="home-header"
        role="button"
        tabIndex={0}
        aria-label="A looping reel of selected work: Xbox Arcade, ForeFlight, Who Owns Seattle and Project Open. Go to the case studies."
        onClick={goToWork}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            goToWork()
          }
        }}
        style={{ backgroundColor: tod.swatches[0] }}
      >
        <canvas ref={canvas} className="hh-field" />
      </div>
    </div>
  )
}
