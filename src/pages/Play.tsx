import { MediaBlock } from '../components/MediaBlock'
import { playItems } from '../data/site'

/** Play: a loose two-column grid of experiments and side projects. */
export function Play() {
  return (
    <section className="play" aria-label="Play">
      {playItems.map((item) => (
        <figure key={item.title} className="play-item">
          <MediaBlock src={item.image} className={`play-media play-media--${item.shape}`} />
          <figcaption className="play-caption">
            <span>{item.title}</span>
            <span>{item.medium}</span>
            <span>{item.year}</span>
          </figcaption>
        </figure>
      ))}
    </section>
  )
}
