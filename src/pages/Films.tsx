import { useState } from 'react'
import { MediaBlock } from '../components/MediaBlock'
import { films, filmsIntro, type Film } from '../data/site'

/** Films: videography, motion and short films, two to a row. Each thumbnail swaps for the YouTube player on click. */
export function Films() {
  return (
    <section aria-label="Films">
      <p className="films-intro">{filmsIntro}</p>
      <div className="films">
        {films.map((film) => (
          <FilmItem key={film.youtubeId} film={film} />
        ))}
      </div>
    </section>
  )
}

function FilmItem({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className="film">
      {playing ? (
        <div className="film-embed">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`}
            title={film.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        <MediaBlock src={`https://i.ytimg.com/vi/${film.youtubeId}/maxresdefault.jpg`} className="film-media" still>
          <button type="button" className="media-play" onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          </button>
        </MediaBlock>
      )}
      <figcaption className="film-caption">
        <span className="film-title">{film.title}</span>
        <span>{film.year ? `${film.category} · ${film.year}` : film.category}</span>
        <span>{film.description}</span>
      </figcaption>
    </figure>
  )
}
