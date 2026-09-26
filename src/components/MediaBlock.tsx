import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { hasRevealed, markRevealed } from '../lib/revealed'

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
  /** Optional muted video; a play/pause button in the bottom-right corner fades it in over the image. */
  video?: string
  /** Overlay content inside the frame (e.g. a caption), revealed along with the image. */
  children?: ReactNode
}

/**
 * Image block with the same motion language as the home rows: scrubbed
 * parallax while it passes through the viewport, plus a one-shot clip/scale
 * reveal when it enters.
 */
export function MediaBlock({ src, alt = '', className = '', withFloat = false, skipReveal = false, still = false, video, children }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  // What the viewer asked for, separate from whether it's playing (we pause it while offscreen).
  const wantsPlay = useRef(false)

  const frameRef = useRef<HTMLCanvasElement>(null)

  // Freeze the current frame onto a canvas (object-fit: cover math) so a paused video
  // never falls back to the poster image, whatever the browser does with the paused layer.
  const freezeFrame = () => {
    const v = videoRef.current
    const c = frameRef.current
    if (!v || !c || !v.videoWidth) return
    const w = c.clientWidth
    const h = c.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const scale = Math.max(w / v.videoWidth, h / v.videoHeight)
    const sw = w / scale
    const sh = h / scale
    c.getContext('2d')?.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, c.width, c.height)
  }

  const toggleVideo = () => {
    const v = videoRef.current
    if (!v) return
    wantsPlay.current = v.paused
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  // Pause while scrolled out of view; resume on return if the viewer had it playing.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !root.current) return
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) v.pause()
      else if (wantsPlay.current) v.play().catch(() => {})
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
              className={`media-video${started ? ' is-started' : ''}`}
              src={video}
              muted
              loop
              playsInline
              preload="metadata"
              disablePictureInPicture
              aria-hidden="true"
              onPlaying={() => {
                setStarted(true)
                setPlaying(true)
              }}
              onPause={() => {
                freezeFrame()
                setPlaying(false)
              }}
            />
          )}
          {video && <canvas ref={frameRef} className={`media-frame${started && !playing ? ' is-shown' : ''}`} aria-hidden="true" />}
        </div>
      </div>
      {video && (
        <button type="button" className="media-play" onClick={toggleVideo} aria-label={playing ? 'Pause video' : 'Play video'}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3.5" y="2.5" width="3" height="11" />
              <rect x="9.5" y="2.5" width="3" height="11" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          )}
        </button>
      )}
      {children}
      {!src && withFloat && (
        <div className="media-float" aria-hidden="true">
          <div className="media-float-card" />
        </div>
      )}
    </div>
  )
}
