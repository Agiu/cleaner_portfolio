import { Lexer, Parser, type Token, type Tokens } from 'marked'

// Case study page content, written in Markdown (src/content/work/<slug>.md).
//
//   ## Heading          starts a section; also its entry in the sidebar's Contents nav.
//                       Optional id: "## Sharpening the Focus {#focus}" (defaults to a slug of the title).
//   > One line          the large lead statement.
//   Plain paragraphs    body copy. **bold**, *italic* and [links](https://…) work.
//   ### Subheading      a smaller heading inside the section.
//   ![alt](src)         an image. Images on consecutive lines share a row: one runs full
//                       width, two sit side by side. A blank line between them starts a new row.
//   ![alt](src "still 1461/530")
//                       row options in the image title: "still" (edge to edge, no parallax — for
//                       diagrams and UI shots) and/or an aspect ratio like 16/9.

export type MediaImage = { src: string; alt: string }

export type SectionBlock =
  | { kind: 'lead'; html: string }
  | { kind: 'paragraph'; html: string }
  | { kind: 'subheading'; html: string }
  | { kind: 'list'; html: string }
  | { kind: 'media'; images: MediaImage[]; still: boolean; aspect?: string }

export type CaseStudySection = { id: string; title: string; blocks: SectionBlock[] }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const inline = (tokens: Token[] | undefined) => Parser.parseInline(tokens ?? [])

/** A paragraph made only of images (and the line breaks between them) is a media row. */
function asMediaRow(p: Tokens.Paragraph): SectionBlock | null {
  const parts = p.tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()) && t.type !== 'br')
  if (!parts.length || !parts.every((t) => t.type === 'image')) return null
  const images = parts as Tokens.Image[]
  const options = images.map((img) => img.title ?? '').join(' ')
  return {
    kind: 'media',
    images: images.map((img) => ({ src: img.href, alt: img.text })),
    still: /\bstill\b/.test(options),
    aspect: options.match(/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/)?.[0].replace(/\s/g, ''),
  }
}

export function parseCaseStudy(markdown: string): CaseStudySection[] {
  const sections: CaseStudySection[] = []
  let current: CaseStudySection | null = null

  for (const token of Lexer.lex(markdown)) {
    if (token.type === 'heading' && token.depth <= 2) {
      const [, title, id] = token.text.match(/^(.*?)\s*(?:\{#([\w-]+)\})?$/) ?? [, token.text]
      current = { id: id ?? slugify(title!), title: title!, blocks: [] }
      sections.push(current)
      continue
    }
    if (!current) continue // anything before the first ## heading (e.g. notes) is ignored

    switch (token.type) {
      case 'heading':
        current.blocks.push({ kind: 'subheading', html: inline(token.tokens) })
        break
      case 'blockquote':
        current.blocks.push({ kind: 'lead', html: inline((token.tokens ?? []).flatMap((t) => ('tokens' in t ? t.tokens ?? [] : [t]))) })
        break
      case 'paragraph':
        current.blocks.push(asMediaRow(token as Tokens.Paragraph) ?? { kind: 'paragraph', html: inline(token.tokens) })
        break
      case 'list':
        current.blocks.push({ kind: 'list', html: Parser.parse([token]) })
        break
    }
  }
  return sections
}
