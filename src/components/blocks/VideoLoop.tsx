import { useEffect, useRef } from 'react'
import { fenceParts } from './Stage'

/*
 * ```video: a muted clip (`url`, or `url | caption`) that plays on a loop while it's on screen and
 * pauses off it, rounded at the image rows' edges like the images. Reduced motion leaves it on
 * its first frame with the controls showing.
 */
export function VideoLoop({ content }: { name: string; content: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [src = '', caption] = fenceParts(content.trim().split('\n')[0] ?? '')
  const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const v = video.current
    if (!v || still) return
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.35 })
    io.observe(v)
    return () => io.disconnect()
  }, [still])

  if (!src) return null
  return (
    <figure className="video-loop">
      <video ref={video} src={src} muted loop playsInline preload="metadata" controls={still} aria-label={caption || 'Video'} />
      {caption && <figcaption className="sv-note">{caption}</figcaption>}
    </figure>
  )
}
