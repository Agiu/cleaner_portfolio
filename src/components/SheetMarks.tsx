/**
 * The drawing sheet's furniture, shared by every panel in the v2 layouts (statement lists, stats,
 * decisions, code, audio tracks, the tri-axis drawing): a faint dot grid and a crop mark in each
 * corner. Place it first inside a `.sv-feature-panel`, which gives the sheet its ground and shape.
 */
export function SheetMarks() {
  return (
    <>
      <span className="sv-feature-grid" aria-hidden="true" />
      {['tl', 'tr', 'bl', 'br'].map((corner) => (
        <span key={corner} className={`sv-feature-mark sv-feature-mark--${corner}`} aria-hidden="true" />
      ))}
    </>
  )
}
