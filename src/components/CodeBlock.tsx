import { useState, type ReactNode } from 'react'

/** Display names for the fence languages the case studies use. */
const LANGUAGES: Record<string, string> = {
  cs: 'C#',
  csharp: 'C#',
  js: 'JavaScript',
  ts: 'TypeScript',
  py: 'Python',
  python: 'Python',
}

const KEYWORDS = new Set(
  (
    'using public private protected internal static readonly const class struct interface enum new return if else ' +
    'for foreach while do break continue switch case default void bool int float double string var null true false ' +
    'this base typeof in out ref async await function let import from export def self None True False'
  ).split(' '),
)

// One pass per line: comment, string, number, word, or anything else (down to a lone quote).
const TOKEN = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)|([^\w\s"']+|\s+|.)/g

/**
 * Monochrome highlighting to suit the black-and-white system: keywords in full ink, types
 * medium weight, strings and numbers grey, comments lighter still.
 */
function highlight(line: string, lang: string | undefined): ReactNode[] {
  const hashComments = lang === 'py' || lang === 'python'
  const out: ReactNode[] = []
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(line))) {
    const [text, comment, str, num, word] = m
    const k = out.length
    if (comment && (comment.startsWith('//') || hashComments)) out.push(<span key={k} className="code-com">{text}</span>)
    else if (comment) out.push(text) // a lone # outside Python (e.g. C#'s preprocessor) stays plain
    else if (str) out.push(<span key={k} className="code-str">{text}</span>)
    else if (num) out.push(<span key={k} className="code-num">{text}</span>)
    else if (word && KEYWORDS.has(word)) out.push(<span key={k} className="code-kw">{text}</span>)
    else if (word && /^[A-Z]/.test(word)) out.push(<span key={k} className="code-type">{text}</span>)
    else out.push(text)
  }
  return out
}

/** A case study code listing: a header bar (file name, language, copy) over numbered lines. */
export function CodeBlock({ text, lang, file, still = false }: { text: string; lang?: string; file?: string; still?: boolean }) {
  const [copied, setCopied] = useState(false)
  const language = lang ? (LANGUAGES[lang.toLowerCase()] ?? lang) : undefined
  const lines = text.replace(/\n+$/, '').split('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked (e.g. insecure context); the code is still selectable.
    }
  }

  return (
    <figure className="code-block">
      <figcaption className="code-block-bar">
        <span className="code-block-file">{file ?? language ?? 'Code'}</span>
        {file && language && <span className="code-block-lang">{language}</span>}
        <button type="button" className="code-block-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      {/* A scrolling listing keeps the wheel to itself; a `still` one (the v2 code panel shows it
          whole) leaves it to the page's smooth scroll. */}
      <pre className="code-block-body" data-lenis-prevent={still ? undefined : true}>
        <code>
          {lines.map((line, i) => (
            <span key={i} className="code-line">
              <span className="code-ln" aria-hidden="true">
                {i + 1}
              </span>
              <span>{highlight(line, lang?.toLowerCase())}</span>
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
