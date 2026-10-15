import type { ComponentType } from 'react'
import { ContourModel } from './ContourModel'
import { ErrorBars } from './ErrorBars'
import { LinkFlow } from './LinkFlow'
import { LinkSubmenu } from './LinkSubmenu'
import { LogbookCompare } from './LogbookCompare'
import { LogbookPicker } from './LogbookPicker'
import { QuoteGrid } from './QuoteGrid'
import { Insights, LinkButton, Notice, Statements, Stats } from './TextBlocks'
import { TrackStream } from './TrackStream'
import { VariantStrip } from './VariantStrip'
import { YouTubeEmbed } from './YouTubeEmbed'

type BlockProps = { name: string; content: string }

/**
 * Fenced blocks in a case study's Markdown, by fence name. `wide` ones break out of the text
 * grid and run the full width of the page like an image row; the rest sit in the copy column.
 * `beside`: compact enough for a note to sit next to it (elsewhere that note drops below).
 */
const blocks: Record<string, { component: ComponentType<BlockProps>; wide: boolean; beside?: boolean }> = {
  stream: { component: TrackStream, wide: false },
  masters: { component: Notice, wide: false },
  recruiter: { component: Notice, wide: false },
  stats: { component: Stats, wide: false },
  button: { component: LinkButton, wide: false },
  insights: { component: Insights, wide: false },
  hmw: { component: Statements, wide: false },
  rules: { component: Statements, wide: false },
  questions: { component: Statements, wide: false },
  quotes: { component: QuoteGrid, wide: true },
  '3d-model': { component: ContourModel, wide: true },
  youtube: { component: YouTubeEmbed, wide: true },
  errorbars: { component: ErrorBars, wide: true },
  flow: { component: LinkFlow, wide: true },
  variants: { component: VariantStrip, wide: true },
  submenu: { component: LinkSubmenu, wide: true, beside: true },
  logbook: { component: LogbookPicker, wide: true, beside: true },
  'logbook-compare': { component: LogbookCompare, wide: true },
}

export const isPrototype = (name: string) => Object.prototype.hasOwnProperty.call(blocks, name)
export const isWidePrototype =(name: string) => blocks[name]?.wide ?? false
export const fitsNoteBeside = (name: string) => blocks[name]?.beside ?? false

export function Prototype({ name, content }: BlockProps) {
  const block = blocks[name]
  // A fence with no prototype behind it (yet) shows its content as written.
  if (!block) return <pre className="study-section-pre">{content}</pre>
  const Block = block.component
  return <Block name={name} content={content} />
}
