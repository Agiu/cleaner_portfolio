import { useEffect, useState } from 'react'
import { profile } from '../data/caseStudies'

export type RGB = [number, number, number]
export type Palette = { lo: RGB; mid: RGB; hi: RGB }

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB

// Moods the header passes through across a day (shadow -> body -> highlight).
const NIGHT: Palette = { lo: hex('#03031a'), mid: hex('#0000cd'), hi: hex('#6b94ff') }
const DAWN: Palette = { lo: hex('#1a0820'), mid: hex('#c2507a'), hi: hex('#ffc7a1') }
const DAY: Palette = { lo: hex('#04172e'), mid: hex('#2a86e8'), hi: hex('#d9f1ff') }
const GOLDEN: Palette = { lo: hex('#2a0c03'), mid: hex('#e8711a'), hi: hex('#ffdc85') }
const DUSK: Palette = { lo: hex('#0e0520'), mid: hex('#7a2fc4'), hi: hex('#f5a3e6') }

// Hour -> palette stops; colours blend linearly between neighbouring stops.
const STOPS: { hour: number; palette: Palette }[] = [
  { hour: 0, palette: NIGHT },
  { hour: 4.5, palette: NIGHT },
  { hour: 6.5, palette: DAWN },
  { hour: 9.5, palette: DAY },
  { hour: 15.5, palette: DAY },
  { hour: 18, palette: GOLDEN },
  { hour: 20, palette: DUSK },
  { hour: 22, palette: NIGHT },
  { hour: 24, palette: NIGHT },
]

const PHASES: { until: number; name: string }[] = [
  { until: 5, name: 'Night' },
  { until: 8, name: 'Dawn' },
  { until: 16, name: 'Day' },
  { until: 19, name: 'Golden hour' },
  { until: 21.5, name: 'Dusk' },
  { until: 24, name: 'Night' },
]

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as RGB

export function paletteAt(hour: number): Palette {
  const i = STOPS.findIndex((s) => s.hour > hour)
  const a = STOPS[Math.max(0, i - 1)]
  const b = STOPS[i === -1 ? STOPS.length - 1 : i]
  const t = b.hour === a.hour ? 0 : (hour - a.hour) / (b.hour - a.hour)
  return { lo: mixRGB(a.palette.lo, b.palette.lo, t), mid: mixRGB(a.palette.mid, b.palette.mid, t), hi: mixRGB(a.palette.hi, b.palette.hi, t) }
}

/** Fractional hour (0-24) in the portfolio's home time zone. */
export function localHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: profile.timeZone })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {})
  return Number(parts.hour) + Number(parts.minute) / 60
}

const toCss = ([r, g, b]: RGB) => `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`

/** Current palette, phase name and clock for the header; refreshes every 30s. */
export function useTimeOfDay() {
  const read = () => {
    const now = new Date()
    const hour = localHour(now)
    const palette = paletteAt(hour)
    return {
      hour,
      palette,
      phase: PHASES.find((p) => hour < p.until)!.name,
      clock: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: profile.timeZone })
        .format(now)
        .replace(/\s/g, '')
        .toLowerCase(),
      swatches: [palette.lo, palette.mid, palette.hi].map(toCss),
    }
  }
  const [state, setState] = useState(read)
  useEffect(() => {
    const id = setInterval(() => setState(read()), 30_000)
    return () => clearInterval(id)
  }, [])
  return state
}
