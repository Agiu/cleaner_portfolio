import { useRef, type ReactNode, type RefObject } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

/**
 * The same one-shot scan reveal MediaBlock gives an image: the clip opens top to bottom as the
 * block enters, so a prototype arrives on the page the way a picture in the same slot would.
 */
export function useScanReveal(ref: RefObject<HTMLElement>) {
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.5,
            ease: 'power3.inOut',
            clearProps: 'clipPath',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          },
        )
      })
    },
    { scope: ref },
  )
}

/** The white canvas a prototype sits on, revealed like an image. */
export function Stage({ className = '', children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useScanReveal(root)
  return (
    <div ref={root} className={`proto-stage ${className}`}>
      {children}
    </div>
  )
}

/** A fence body as `key: value` pairs, keys lower-cased; blank lines and lines without a colon are skipped. */
export function fenceEntries(content: string): [string, string][] {
  return content.split('\n').flatMap((raw) => {
    const line = raw.trim()
    const colon = line.indexOf(':')
    if (colon === -1) return []
    return [[line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()]]
  })
}

/** `a | b | c` → ['a', 'b', 'c'] */
export const fenceParts = (value: string) => value.split('|').map((part) => part.trim())
