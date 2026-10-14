import { Marked, type Token, type Tokens, type TokenizerAndRendererExtension } from 'marked'
import { isPrototype } from '../components/blocks'

// Case study page content, written in Markdown (src/content/work/<slug>.md).
//
//   ## Heading          starts a section; also its entry in the sidebar's Contents nav.
//                       Optional id: "## Sharpening the Focus {#focus}" (defaults to a slug of the title).
//                       "## Heading | Lead line" is shorthand for a heading followed by "> Lead line".
//   > One line          the large lead statement, when it opens the section. Any later > is a
//                       note: a small aside in the copy column.
//   Plain paragraphs    body copy. **bold**, *italic*, ==highlight== and [links](https://…) work.
//   ### Subheading      a smaller heading inside the section.
//   ![caption](src)     an image; its alt text shows as a small caption under it. Images on
//                       consecutive lines share a row: one runs full width, two sit side by
//                       side. A blank line between them starts a new row.
//   ![alt](src "still 1461/530")
//                       row options in the image title: "still" (edge to edge, no parallax — for
//                       diagrams and UI shots), "clear" (no grey placeholder behind it — for cut-outs
//                       with transparent backgrounds) and/or an aspect ratio like 16/9. Given in
//                       pixels (863/747), the ratio is also the image's size: it's never shown
//                       wider than that, so smaller images sit centred instead of full bleed.
//   ![alt](src "side 977/925")
//                       "side": instead of a full-width row, the image sits in the left column
//                       beside the text that follows it (until the next image row).
//   ```flow             an interactive prototype; the fence name picks the component and the
//   …                   fence body is its content (see src/components/blocks). ```youtube is one.
//   ```
//   > Note              a note on the line straight after the closing fence (no blank line) sits
//                       beside the prototype, like images sharing a row; a blank line puts it below.
//   ```csharp File.cs   any other fenced block is shown as code: the language, then an optional
//   …                   file name for the block's header bar.
//   ```
//   ![Title](track.mp3) an audio track. Consecutive lines make one track list.

export type MediaImage = { src: string; alt: string }
export type AudioTrack = { src: string; title: string }

export type SectionBlock =
  | { kind: 'lead'; html: string }
  | { kind: 'note'; html: string }
  | { kind: 'paragraph'; html: string }
  | { kind: 'subheading'; html: string }
  | { kind: 'list'; html: string }
  | { kind: 'code'; text: string; lang?: string; file?: string }
  | { kind: 'audio'; tracks: AudioTrack[] }
  | {
      kind: 'media'
      images: MediaImage[]
      still: boolean
      clear: boolean
      side: boolean
      aspect?: string
      maxWidth?: number
    }
  | { kind: 'prototype'; name: string; content: string; aside?: string }

export type CaseStudySection = { id: string; title: string; blocks: SectionBlock[] }

/** ==text== → <mark>, read a step stronger than the copy around it. */
const highlight: TokenizerAndRendererExtension = {
  name: 'highlight',
  level: 'inline',
  start: (src) => src.indexOf('=='),
  tokenizer(src) {
    const match = /^==(?=\S)([\s\S]*?\S)==/.exec(src)
    if (match) return { type: 'highlight', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) }
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens ?? [])}</mark>`
  },
}

const markdown = new Marked({
  extensions: [highlight],
  renderer: {
    // Links off the site open in a new tab.
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens)
      const attr = (s: string) => s.replace(/"/g, '&quot;')
      const external = /^https?:\/\//.test(href)
      return `<a href="${attr(href)}"${title ? ` title="${attr(title)}"` : ''}${external ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`
    },
  },
})

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const inline = (tokens: Token[] | undefined) => markdown.Parser.parseInline(tokens ?? [], markdown.defaults)

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
  const aspect = options.match(/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/)?.[0].replace(/\s/g, '')
  const aspectWidth = aspect ? Number(aspect.split('/')[0]) : 0
  return {
    kind: 'media',
    images: images.map((img) => ({ src: img.href, alt: img.text })),
    still: /\bstill\b/.test(options),
    clear: /\bclear\b/.test(options),
    side: /\bside\b/.test(options),
    aspect,
    // Written in pixels (863/747 rather than 16/9): the image's own size, so it's never
    // stretched past it — a small image sits centred at its own width instead of full bleed.
    maxWidth: aspectWidth > 100 ? aspectWidth : undefined,
  }
}

/** The fence's info string is "<language> <file name>", both optional. */
function codeBlock(token: Tokens.Code): SectionBlock {
  const [lang, file] = (token.lang ?? '').trim().split(/\s+/)
  return { kind: 'code', text: token.text, lang: lang || undefined, file: file || undefined }
}

export function parseCaseStudy(source: string): CaseStudySection[] {
  const sections: CaseStudySection[] = []
  let current: CaseStudySection | null = null
  let prev: Token | undefined

  for (const token of markdown.lexer(source)) {
    // A blank line between blocks is its own "space" token, so this is only the fence when they touch.
    const before = prev
    prev = token
    if (token.type === 'heading' && token.depth <= 2) {
      const [heading, lead] = token.text.split(/\s+\|\s+/, 2)
      const [, title, id] = heading.match(/^(.*?)\s*(?:\{#([\w-]+)\})?$/) ?? [, heading]
      current = { id: id ?? slugify(title!), title: title!, blocks: [] }
      if (lead) current.blocks.push({ kind: 'lead', html: markdown.parseInline(lead) as string })
      sections.push(current)
      continue
    }
    if (!current) continue // anything before the first ## heading (e.g. notes) is ignored

    switch (token.type) {
      case 'heading':
        current.blocks.push({ kind: 'subheading', html: inline(token.tokens) })
        break
      case 'blockquote': {
        const html = inline((token.tokens ?? []).flatMap((t) => ('tokens' in t ? t.tokens ?? [] : [t])))
        const last = current.blocks[current.blocks.length - 1]
        if (before?.type === 'code' && last?.kind === 'prototype' && !last.aside) last.aside = html
        else current.blocks.push({ kind: current.blocks.length ? 'note' : 'lead', html })
        break
      }
      case 'paragraph':
        current.blocks.push(asMediaRow(token as Tokens.Paragraph) ?? { kind: 'paragraph', html: inline(token.tokens) })
        break
      case 'list':
        current.blocks.push({ kind: 'list', html: markdown.parser([token]) })
        break
      case 'code': {
        // "```Image Carousel" and "```image-carousel" name the same block; unknown names are code.
        const name = (token.lang ?? '').trim().toLowerCase().replace(/\s+/g, '-')
        current.blocks.push(
          isPrototype(name) ? { kind: 'prototype', name, content: token.text.trim() } : codeBlock(token as Tokens.Code),
        )
        break
      }
    }
  }
  return sections
}
