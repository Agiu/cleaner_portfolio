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
//   ![alt](src "side 977/925")
//                       "side": instead of a full-width row, the image sits in the left column
//                       beside the text that follows it (until the next image row).
//   ```youtube          a YouTube video, full width like an image row. The fence holds just the
//   VIDEO_ID            video id (the part after watch?v= or youtu.be/).
//   ```
//   ```csharp File.cs   any other fenced block is shown as code: the language, then an optional
//   …                   file name for the block's header bar.
//   ```
//   ![Title](track.mp3) an audio track. Consecutive lines make one track list.

export type MediaImage = { src: string; alt: string }
export type AudioTrack = { src: string; title: string }

export type SectionBlock =
  | { kind: 'lead'; html: string }
  | { kind: 'paragraph'; html: string }
  | { kind: 'subheading'; html: string }
  | { kind: 'list'; html: string }
  | { kind: 'code'; text: string; lang?: string; file?: string }
  | { kind: 'audio'; tracks: AudioTrack[] }
  | { kind: 'media'; images: MediaImage[]; still: boolean; side: boolean; aspect?: string }
  | { kind: 'video'; youtube: string }

export type CaseStudySection = { id: string; title: string; blocks: SectionBlock[] }

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const inline = (tokens: Token[] | undefined) => Parser.parseInline(tokens ?? [])

const AUDIO = /\.(mp3|wav|m4a|ogg)(\?.*)?$/i

/** A paragraph made only of images (and the line breaks between them) is a media row. */
function asMediaRow(p: Tokens.Paragraph): SectionBlock | null {
  const parts = p.tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()) && t.type !== 'br')
  if (!parts.length || !parts.every((t) => t.type === 'image')) return null
  const images = parts as Tokens.Image[]
  if (images.every((img) => AUDIO.test(img.href))) {
    return { kind: 'audio', tracks: images.map((img) => ({ src: img.href, title: img.text })) }
  }
  const options = images.map((img) => img.title ?? '').join(' ')
  return {
    kind: 'media',
    images: images.map((img) => ({ src: img.href, alt: img.text })),
    still: /\bstill\b/.test(options),
    side: /\bside\b/.test(options),
    aspect: options.match(/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/)?.[0].replace(/\s/g, ''),
  }
}

/** The fence's info string is "<language> <file name>", both optional. */
function codeBlock(token: Tokens.Code): SectionBlock {
  const [lang, file] = (token.lang ?? '').trim().split(/\s+/)
  return { kind: 'code', text: token.text, lang: lang || undefined, file: file || undefined }
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
      case 'code':
        current.blocks.push(
          token.lang === 'youtube' ? { kind: 'video', youtube: token.text.trim() } : codeBlock(token as Tokens.Code),
        )
        break
    }
  }
  return sections
}
