import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { fenceParts, Stage } from './Stage'

/**
 * ```quotes — `Quote | Who said it` per line. Laid out all at once as pull quotes rather than
 * one at a time in a carousel, so every voice is read, in the type the résumé uses for its
 * summaries; attribution small and grey behind the nav's dash.
 */
export function QuoteGrid({ content }: { content: string }) {
  const root = useRef<HTMLUListElement>(null)
  const quotes = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => fenceParts(l))

  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          gsap.utils.toArray(root.current!.children),
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 85%', once: true } },
        )
      })
    },
    { scope: root },
  )

  if (!quotes.length) return null

  return (
    <Stage>
      <ul ref={root} className="proto-quotes">
        {quotes.map(([text, who], i) => (
          <li key={i}>
            <blockquote>“{text.replace(/^["“]|["”]$/g, '')}”</blockquote>
            {who && <p className="proto-quotes-who">{who}</p>}
          </li>
        ))}
      </ul>
    </Stage>
  )
}
