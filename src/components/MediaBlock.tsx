import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { hasRevealed, markRevealed } from '../lib/revealed'
import { restoreVideoTime, saveVideoTime } from '../lib/videoTime'

type Props = {
  src?: string
  /** Alt text for the image; empty (decorative) by default. */
  alt?: string
  className?: string
  /** Show the floating mock-up card on the placeholder (used for the hero). */
  withFloat?: boolean
  /** Skip the entrance reveal (e.g. when a page transition already put the image in place). */
  skipReveal?: boolean
  /** No parallax and no overscan crop — for diagrams and UI shots that must show edge to edge. */
  still?: boolean
  /** Optional muted, looping video that fades in over the image while it plays. */
  video?: string
  /** Seconds into the video to start from (where the cover still was taken). */
  videoStart?: number
  /** Whether the video should be playing (e.g. while its card is hovered). Defaults to always,
   *  unless the viewer prefers reduced motion. It only actually plays while on screen. */
  play?: boolean
  /** Overlay content inside the frame (e.g. a caption), revealed along with the image. */
  children?: ReactNode
}

/**
 * Image block with the same motion language as the home rows: scrubbed
 * parallax while it passes through the viewport, plus a one-shot clip/scale
 * reveal when it enters.
 */
/** How long a hover video takes to fade in and out; matches .media-video's transition. */
export const VIDEO_FADE_MS = 600

export function MediaBlock({ src, alt = '', className = '', withFloat = false, skipReveal = false, still = false, video, videoStart, play, children }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showing, setShowing] = useState(false)
  const inView = useRef(false)
  const wants = play ?? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const wantsRef = useRef(wants)
  wantsRef.current = wants

  // Stopping, it keeps playing while it fades back to the still (.media-video), then pauses.
  const pauseTimer = useRef(0)
  const sync = () => {
    const v = videoRef.current
    if (!v) return
    clearTimeout(pauseTimer.current)
    if (wantsRef.current && inView.current) v.play().catch(() => {})
    else pauseTimer.current = window.setTimeout(() => v.pause(), VIDEO_FADE_MS)
  }
  useEffect(sync, [wants])

  // Play only while on screen.
  useEffect(() => {
    if (!video || !root.current) return
    const io = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting
      sync()
    })
    io.observe(root.current)
    return () => io.disconnect()
  }, [video])

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        const trigger = root.current

        if (!still) {
          gsap.fromTo(
            q('.media-parallax'),
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
        if (withFloat && !src) {
          gsap.fromTo(
            q('.media-float'),
            { y: 60 },
            {
              y: -60,
              ease: 'none',
              scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }

        // Already shown once this visit: leave it in place rather than replaying the reveal.
        if (skipReveal || hasRevealed(src)) return
        // Scan reveal: the clip opens top-to-bottom while the image inside zooms out to rest.
        // Plays once; scrolling back up doesn't hide it again.
        gsap
          .timeline({ scrollTrigger: { trigger, start: 'top 85%', once: true }, onStart: () => markRevealed(src) })
          .fromTo(
            trigger,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' },
            0,
          )
          .fromTo(q('.media-scale'), { scale: 1.3 }, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0)
      })
    },
    { scope: root, dependencies: [still] },
  )

  return (
    <div ref={root} className={`media${still ? ' media--still' : ''} ${className}`}>
      <div className="media-scale">
        <div className="media-parallax">
          {src ? <img src={src} alt={alt} /> : <div className="cs-placeholder" />}
          {video && (
            <video
              ref={videoRef}
              className={`media-video${showing && wants ? ' is-started' : ''}`}
              src={video}
              data-start={videoStart}
              muted
              loop
              playsInline
              preload="metadata"
              disablePictureInPicture
              aria-hidden="true"
              onLoadedMetadata={(e) => restoreVideoTime(e.currentTarget)}
              onPlaying={() => setShowing(true)}
              onTimeUpdate={(e) => saveVideoTime(e.currentTarget)}
            />
          )}
        </div>
      </div>
      {children}
      {!src && withFloat && (
        <div className="media-float" aria-hidden="true">
          <div className="media-float-card" />
        </div>
      )}
    </div>
  )
}
