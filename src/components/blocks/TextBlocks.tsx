import { ArrowLink } from '../Profile'
import { fenceParts } from './Stage'

/*
 * Small fenced blocks that sit in the copy column, set in the page's own type:
 *
 *   ```masters / ```recruiter   a notice: `Title | Body` (both optional for masters)
 *   ```stats                    `Value | Label` per line (a third icon field is ignored)
 *   ```button                   `Label | URL`, drawn as the sidebar's arrow-link row
 *   ```insights                 `Title | Description` per line, numbered
 *   ```hmw / ```rules / ```questions   one sentence per line
 */

const lines = (content: string) =>
  content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const NOTICES: Record<string, { title: string; body: string }> = {
  masters: {
    title: 'Academic Work',
    body: 'This is a Master’s project from the MHCI + Design program at the University of Washington.',
  },
  recruiter: { title: 'Heads Up', body: '' },
}

export function Notice({ name, content }: { name: string; content: string }) {
  const preset = NOTICES[name] ?? NOTICES.recruiter
  const [title, body] = fenceParts(content.replace(/\s*\n\s*/g, ' '))
  const text = body || preset.body
  if (!text) return null
  return (
    <aside className="proto-notice">
      <p className="proto-notice-title">{title || preset.title}</p>
      <p>{text}</p>
    </aside>
  )
}

export function Stats({ content }: { content: string }) {
  const stats = lines(content).map((l) => fenceParts(l))
  if (!stats.length) return null
  return (
    <dl className="proto-stats">
      {stats.map(([value, label], i) => (
        <div key={i}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function LinkButton({ content }: { content: string }) {
  const [label, href] = fenceParts(lines(content)[0] ?? '')
  if (!label || !href) return null
  return (
    <div className="proto-button">
      <ArrowLink href={href} label={label} />
    </div>
  )
}

export function Insights({ content }: { content: string }) {
  const items = lines(content).map((l) => fenceParts(l))
  if (!items.length) return null
  return (
    <ol className="proto-insights">
      {items.map(([title, description], i) => (
        <li key={i}>
          <span className="proto-insights-index">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <p className="proto-insights-title">{title}</p>
            {description && <p>{description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** `hmw` sentences carry their own "How might we"; the other lists get a small label. */
const STATEMENT_LABELS: Record<string, string> = { rules: 'Rules', questions: 'Questions' }

/** One sentence per line, a step up from the copy, hung off a rule like the stream list. */
export function Statements({ name, content }: { name: string; content: string }) {
  const items = lines(content)
  if (!items.length) return null
  return (
    <div className="proto-statements">
      {STATEMENT_LABELS[name] && <p className="proto-statements-label">{STATEMENT_LABELS[name]}</p>}
      {items.map((text, i) => (
        <p key={i} className="proto-statements-text">
          {text}
        </p>
      ))}
    </div>
  )
}
