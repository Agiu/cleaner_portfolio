/**
 * The sidebar links' hairline arrows (assets/arrow-ne.svg, arrow-down.svg) for inline use in text:
 * 1px square-ended strokes in the link's own colour, so ←/→/↗ links match the Resume row.
 */
const paths = {
  ne: { w: 12.5, h: 7, d: 'M0 6.5H6.85714L12 0.5M12 6.5V0.5H6.85714' },
  e: { w: 11, h: 8, d: 'M0 4H10.5M7 0.5L10.5 4L7 7.5' },
  w: { w: 11, h: 8, d: 'M11 4H0.5M4 0.5L0.5 4L4 7.5' },
}

export function Arrow({ dir }: { dir: keyof typeof paths }) {
  const { w, h, d } = paths[dir]
  return (
    <svg className="arrow" width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" />
    </svg>
  )
}
