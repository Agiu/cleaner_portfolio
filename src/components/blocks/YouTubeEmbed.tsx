import { useRef, useState } from 'react'
import { useScanReveal } from './Stage'

/**
 * ```youtube — a video id, optionally followed by "| unmute" to start that one with sound.
 * A click-to-load facade (thumbnail + the site's play button) that only swaps in the
 * youtube-nocookie player when pressed, so the page doesn't load a heavy player up front.
 */
export function YouTubeEmbed({ content }: { content: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  useScanReveal(root)

  const [line = ''] = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const [id = '', flag = ''] = line.split('|').map((part) => part.trim())
  const muted = !/^unmuted?$/i.test(flag)
  if (!id) return null

  return (
    <div ref={root} className="media proto-video">
      {playing ? (
        <iframe
          className="proto-video-frame"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button type="button" className="proto-video-facade" onClick={() => setPlaying(true)} aria-label="Play video">
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" />
          <span className="media-play" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
