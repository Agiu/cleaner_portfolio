import { useEffect, useRef, useState } from 'react'
import type { AudioTrack } from '../lib/caseStudyMarkdown'

// Only one track on the page plays at a time.
let playing: HTMLAudioElement | null = null

const clock = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––')

function Track({ track, index }: { track: AudioTrack; index: number }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(NaN)

  useEffect(() => () => audio.current?.pause(), [])

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) {
      if (playing && playing !== a) playing.pause()
      playing = a
      a.play().catch(() => {})
    } else a.pause()
  }

  // The rule under the title doubles as the scrubber.
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = audio.current
    if (!a || !Number.isFinite(a.duration)) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * a.duration
  }
  const seekKey = (e: React.KeyboardEvent) => {
    const a = audio.current
    if (!a || !Number.isFinite(a.duration)) return
    if (e.key === 'ArrowRight') a.currentTime = Math.min(a.duration, a.currentTime + 5)
    else if (e.key === 'ArrowLeft') a.currentTime = Math.max(0, a.currentTime - 5)
    else return
    e.preventDefault()
  }

  const progress = Number.isFinite(duration) && duration > 0 ? time / duration : 0

  return (
    <li className={`audio-track${isPlaying ? ' is-playing' : ''}`}>
      <audio
        ref={audio}
        src={track.src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <button type="button" className="audio-track-play" onClick={toggle} aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.title}`}>
        {isPlaying ? (
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
      <span className="audio-track-index">{String(index + 1).padStart(2, '0')}</span>
      <span className="audio-track-title">{track.title}</span>
      <span className="audio-track-time">
        {isPlaying || time > 0 ? `${clock(time)} / ` : ''}
        {clock(duration)}
      </span>
      <div
        className="audio-track-rule"
        role="slider"
        tabIndex={0}
        aria-label={`Seek ${track.title}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(Number.isFinite(duration) ? duration : 0)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={clock(time)}
        onPointerDown={seek}
        onKeyDown={seekKey}
      >
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </li>
  )
}

/** A track list for case study audio: numbered rows, each with play/pause, time and a scrub rule. */
export function AudioTracks({ tracks }: { tracks: AudioTrack[] }) {
  return (
    <ol className="audio-tracks">
      {tracks.map((track, i) => (
        <Track key={track.src} track={track} index={i} />
      ))}
    </ol>
  )
}
