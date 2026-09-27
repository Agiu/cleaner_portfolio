import type { Palette, RGB } from './timeOfDay'

/*
 * The home header's motion graphic: a looping reel of the work on kaelub.com, drawn as
 * technical line art on a 2D canvas. Each project is a scene that draws itself on, runs, and
 * draws itself off again as the next one draws on. Colours come from the time-of-day palette (lo =
 * ground, mid/hi = linework), so the reel drifts from dawn to night like the old header did.
 */

type Pointer = { x: number; y: number }
type Box = { x: number; y: number; w: number; h: number }
/** Where scenes draw: box is in stage units, placed at (x, y) in the frame and scaled by k. */
type Stage = { x: number; y: number; k: number; box: Box }

type SceneCtx = {
  ctx: CanvasRenderingContext2D
  box: Box
  /** 0..1 through the scene. */
  p: number
  /** Seconds into the scene. */
  t: number
  /** 0..1 draw-on at the start of the scene. */
  reveal: number
  col: (c: RGB, a?: number) => string
  pal: Palette
}

type Scene = {
  /** The case study on this site, if there is one; the reel links to it. */
  slug?: string
  title: string
  meta: string
  tags: string
  readouts: (s: SceneCtx) => [string, string][]
  draw: (s: SceneCtx) => void
}

const WHITE: RGB = [1, 1, 1]
const SCENE_SECONDS = 6.5
/**
 * Scenes hand over across this overlap rather than cutting or wiping: the outgoing one draws
 * itself off (its draw-on in reverse) while the incoming one draws on in the same space.
 */
const HANDOFF_SECONDS = 1.5
/** A scene's whole life: the handoff that brings it in, then its slot. */
const LIFE_SECONDS = SCENE_SECONDS + HANDOFF_SECONDS
/** How far into a handoff the arriving scene shows (and how far before its end the leaving one goes). */
const SHOWN_SECONDS = 0.5
/** How long a readout takes to swap one word for another. */
const READOUT_FADE = 0.4
const TAU = Math.PI * 2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
/** Eased 0..1 as p runs from a to b: every state change in a scene goes through one of these. */
const ramp = (p: number, a: number, b: number) => easeInOutCubic(clamp01((p - a) / (b - a)))
const mix = (a: RGB, b: RGB, u: number): RGB => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]

function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

type Pt = [number, number]

/** Catmull-Rom through the points, sampled evenly per segment. */
function spline(pts: Pt[], per = 24): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map((d) =>
        0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3),
      ) as Pt)
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/** Strokes a polyline up to a fraction of its length; returns the head point and heading. */
function strokeTo(ctx: CanvasRenderingContext2D, pts: Pt[], frac: number) {
  const n = Math.max(1, Math.floor(frac * (pts.length - 1)))
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.stroke()
  const a = pts[Math.max(0, n - 1)], b = pts[n]
  return { head: b, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 10, weight = 500) {
  ctx.font = `${weight} ${size}px "Open Sauce One", system-ui, sans-serif`
  ctx.fillText(text, x, y)
}

// ---------- Scenes ----------

const xbox: Scene = (() => {
  const games = ['STARDEW VALLEY', 'HADES', 'ORI', 'SEA OF THIEVES', 'GROUNDED']
  const segs = 8
  // Beats, as fractions of the scene: the spin, and the pick settling in as the wheel slows.
  const SPIN = [0.1, 0.72] as const
  const LAND = [0.64, 0.76] as const
  /** Winds up from rest over the first 12%, then coasts to a stop, so the wheel never jumps to speed. */
  const spinEase = (u: number) => {
    const a = 0.12
    const g = u < a ? (u * u) / (2 * a) : u - a / 2
    return easeOutCubic(g / (1 - a / 2))
  }
  return {
    slug: 'xbox',
    title: 'Xbox Arcade',
    meta: 'Product Design · 2026',
    tags: 'CLOUD GAMING / GROUP DECISIONS / DISCORD',
    readouts: ({ p }) => [
      ['PARTY', '4 / 4'],
      ['VOTES', String(Math.min(23, Math.floor(p * 30))).padStart(2, '0')],
      ['PICK', p > LAND[0] + 0.04 ? games[1] : 'SPINNING'],
    ],
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      // The wheel sits dead centre, flanked by the party's ranking (left) and the console (right).
      // Frames too narrow for the flanks get the wheel alone.
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2
      const colW = 190, side = 64
      let R0 = Math.min(box.h * 0.38, box.w / 2 - side - colW - 16)
      const flanks = R0 >= box.h * 0.24
      if (!flanks) R0 = Math.min(box.h * 0.4, box.w * 0.4)
      const R = R0 * (0.85 + 0.15 * reveal)
      const land = ramp(p, LAND[0], LAND[1])
      // Tick ring.
      ctx.strokeStyle = col(pal.hi, 0.45)
      ctx.lineWidth = 1
      for (let i = 0; i < 90 * reveal; i++) {
        const a = (i / 90) * TAU - Math.PI / 2, l = i % 5 === 0 ? 10 : 4
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10))
        ctx.lineTo(cx + Math.cos(a) * (R + 10 + l), cy + Math.sin(a) * (R + 10 + l))
        ctx.stroke()
      }
      // The wheel winds up, spins and settles on a pick.
      const step = TAU / segs
      const u = clamp01((p - SPIN[0]) / (SPIN[1] - SPIN[0]))
      const spin = spinEase(u)
      const rot = -Math.PI / 2 - step * 1.5 + spin * TAU * 3 - TAU * 3
      // Draws on (and off, at the handoff) as the rim sweeps round and the spokes grow out of the hub.
      const sweep = easeInOutCubic(reveal), spoke = easeOutCubic(reveal)
      ctx.strokeStyle = col(pal.hi, 0.7)
      ctx.beginPath()
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * sweep)
      ctx.stroke()
      for (let k = 0; k < segs; k++) {
        const a0 = rot + k * step
        if (k === 1 && land > 0) {
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.arc(cx, cy, R, a0, a0 + step)
          ctx.closePath()
          ctx.fillStyle = col(pal.mid, land * reveal * (0.35 + 0.15 * Math.sin(t * 6)))
          ctx.fill()
        }
        ctx.strokeStyle = col(pal.hi, 0.7)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a0) * R * 0.16, cy + Math.sin(a0) * R * 0.16)
        ctx.lineTo(cx + Math.cos(a0) * R * (0.16 + 0.84 * spoke), cy + Math.sin(a0) * R * (0.16 + 0.84 * spoke))
        ctx.stroke()
        const am = a0 + step / 2
        ctx.fillStyle = col(WHITE, (k === 1 ? 0.55 + 0.4 * land : 0.55) * reveal)
        ctx.save()
        ctx.translate(cx + Math.cos(am) * R * 0.68, cy + Math.sin(am) * R * 0.68)
        // Keep labels upright on the wheel's left half.
        const upright = Math.cos(am) < 0
        ctx.rotate(upright ? am + Math.PI : am)
        label(ctx, `G${String(k + 1).padStart(2, '0')}`, -10, 3, 9)
        ctx.restore()
      }
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.16, 0, TAU)
      ctx.fillStyle = col(pal.lo, 1)
      ctx.fill()
      ctx.strokeStyle = col(pal.hi, 0.9)
      ctx.stroke()
      // Pointer: flicks as each segment edge passes under it, harder the faster the wheel turns.
      const speed = clamp01((spinEase(Math.min(1, u + 0.01)) - spin) * 40)
      const off = (((-Math.PI / 2 - rot) % step) + step) % step
      const flick = Math.max(0, 1 - Math.min(off, step - off) / (step * 0.2)) * speed
      ctx.save()
      ctx.translate(cx, cy - R - 12)
      ctx.rotate(-flick * 0.35)
      ctx.beginPath()
      ctx.moveTo(0, 18)
      ctx.lineTo(-7, 0)
      ctx.lineTo(7, 0)
      ctx.closePath()
      ctx.fillStyle = col(WHITE, 0.95 * reveal)
      ctx.fill()
      ctx.restore()
      if (!flanks) return

      // ---- Right flank: the console ----
      // ASCII Xbox sphere: shaded with characters, the X cut across its face, lit by a light that
      // circles it.
      const xr = cx + R0 + side
      const cols = 26, rows = 13, cw = 6, chH = 10
      const ox = xr, oy = cy - 132
      ctx.font = '9px ui-monospace, Menlo, monospace'
      const shades = ' .:-=+*#%@'
      const la = t * 0.9
      const L = [Math.cos(la) * 0.6, -0.45, 0.66]
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const nx = ((i + 0.5) / cols) * 2 - 1, ny = ((j + 0.5) / rows) * 2 - 1
          const rr = nx * nx + ny * ny
          if (rr > 1 || (j * cols + i) / (rows * cols) > reveal * 1.2) continue
          const nz = Math.sqrt(1 - rr)
          const lum = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * 0.85 + 0.12
          // The X: two curved diagonal bands across the face, wider toward the rim.
          const bend = 0.16 + rr * 0.08
          const cut = Math.abs(nx - ny * 0.92) < bend || Math.abs(nx + ny * 0.92) < bend
          const ch = cut ? ' ' : shades[Math.min(shades.length - 1, Math.floor(lum * shades.length))]
          if (ch === ' ') continue
          ctx.fillStyle = col(lum > 0.6 ? WHITE : pal.hi, 0.35 + lum * 0.6)
          ctx.fillText(ch, ox + i * cw, oy + j * chH + 9)
        }
      }
      ctx.fillStyle = col(WHITE, 0.5)
      label(ctx, 'XBOX CLOUD GAMING', ox, oy + rows * chH + 16, 8)

      // Controller face buttons: A pulses to start the spin, then to join once it lands.
      const bx = xr + 34, by = cy + 80, gap = 22
      const buttons: [string, number, number][] = [['Y', 0, -1], ['X', -1, 0], ['B', 1, 0], ['A', 0, 1]]
      const aPulse = Math.max(pulse(p, SPIN[0]), land * (0.5 + 0.5 * Math.sin(t * 5)))
      buttons.forEach(([k, dx, dy]) => {
        const x = bx + dx * gap, y = by + dy * gap
        const hot = k === 'A' ? aPulse : 0
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, TAU)
        ctx.fillStyle = col(pal.mid, 0.15 + hot * 0.6)
        ctx.fill()
        ctx.strokeStyle = col(k === 'A' ? WHITE : pal.hi, k === 'A' ? 0.9 : 0.6)
        ctx.stroke()
        ctx.fillStyle = col(WHITE, 0.9)
        ctx.textAlign = 'center'
        label(ctx, k, x, y + 3.5, 10, 700)
        ctx.textAlign = 'left'
      })
      // The prompt beside them crossfades through the three states.
      const started = ramp(p, SPIN[0] - 0.01, SPIN[0] + 0.03)
      ;([
        ['PRESS A TO SPIN', 1 - started],
        ['SPINNING…', started * (1 - land)],
        ['PRESS A TO JOIN', land],
      ] as const).forEach(([text, a]) => {
        if (a < 0.01) return
        ctx.fillStyle = col(WHITE, 0.75 * a)
        label(ctx, text, bx + gap + 22, by + 4, 9, 600)
      })

      // ---- Left flank: the party ----
      // Ranking: the party's votes, live; the pick pulls ahead as the wheel lands on it.
      const x0 = cx - R0 - side - colW, y0 = cy - 104
      ctx.fillStyle = col(WHITE, 0.6)
      label(ctx, 'RANKING', x0, y0 - 18, 9)
      games.forEach((g, k) => {
        const y = y0 + k * 36
        const grow = easeOutExpo(clamp01(reveal * 1.4 - k * 0.1))
        const live = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.9 + k * 1.7))
        const v = k === 1 ? live + (0.95 - live) * land : live * (1 - 0.25 * land)
        ctx.fillStyle = col(WHITE, k === 1 ? 0.75 + 0.25 * land : 0.75)
        label(ctx, `${String(k + 1).padStart(2, '0')}  ${g}`, x0, y, 9)
        ctx.fillStyle = col(pal.hi, 0.12)
        ctx.fillRect(x0, y + 7, colW * grow, 3)
        ctx.fillStyle = col(k === 1 ? pal.hi : pal.mid, 0.9)
        ctx.fillRect(x0, y + 7, colW * v * grow, 3)
      })
      // The party (the actual team), each voting as the wheel spins.
      const py = y0 + games.length * 36 + 22
      ctx.fillStyle = col(WHITE, 0.6)
      label(ctx, 'PARTY · 4 / 4', x0, py, 9)
      ;['CA', 'CP', 'SH', 'MF'].forEach((who, k) => {
        const x = x0 + 14 + k * 36, y = py + 24
        const vote = (Math.sin(t * 2.2 + k * 1.9) + 1) / 2
        ctx.beginPath()
        ctx.arc(x, y, 13, 0, TAU)
        ctx.fillStyle = col(pal.mid, 0.18 + 0.2 * Math.max(land, vote))
        ctx.fill()
        ctx.strokeStyle = col(pal.hi, 0.8)
        ctx.stroke()
        ctx.fillStyle = col(WHITE, 0.9)
        ctx.textAlign = 'center'
        label(ctx, who, x, y + 3.5, 9, 700)
        ctx.textAlign = 'left'
        // Vote light: eases to white as their vote comes in, and stays lit once the pick lands.
        ctx.beginPath()
        ctx.arc(x + 9, y + 9, 3, 0, TAU)
        ctx.fillStyle = col(mix(pal.mid, WHITE, Math.max(land, clamp01((vote - 0.35) / 0.3))), 0.95)
        ctx.fill()
      })
    },
  }
})()

const foreflight: Scene = (() => {
  // A wireframe of the web flow I built: Track Logs table -> kebab -> "Link to Logbook" ->
  // the "Add to Logbook" picker (entries from the case study) -> toggle -> linked.
  const logs = [
    ['JUN 14', 'KHYI → KAUS', 'N1327T', '0.9'],
    ['JUN 14', 'KAUS → KHYI', 'N1327T', '1.6'],
    ['JUN 12', 'KSAT → KHYI', 'N4592B', '1.4'],
    ['DEC 07', 'KAUS → KDAL', 'N1327T', '1.1'],
    ['DEC 06', 'KDAL → KAUS', 'N1327T', '1.2'],
    ['NOV 28', 'KHYI → KHYI', 'N4592B', '0.6'],
  ]
  // Entries exactly as in the case study's final design (route | tail | date | total).
  type Entry = { route: string; tail: string; date: string; total: string; linked?: boolean }
  const recent: Entry[] = [
    { route: 'KAUS to KDAL', tail: 'N1327T (PA32)', date: 'Dec 7, 2023', total: '1.1 Total' },
    { route: 'KHYI to KAUS', tail: 'N1327T (PA32)', date: 'Jun 14, 2024', total: '0.9 Total', linked: true },
    { route: 'KAUS to KSAT', tail: 'N1327T (PA32)', date: 'Jun 14, 2024', total: '0.7 Total', linked: true },
    { route: 'KSAT to KHYI', tail: 'N4592B (C172)', date: 'Jun 12, 2024', total: '1.4 Total' },
  ]
  const recommended: Entry[] = [
    { route: 'KAUS to KHYI', tail: 'N1327T (PA32)', date: 'Jun 14, 2024', total: '1.6 Total' },
    { route: 'KSAT to KAUS', tail: 'N4592B (C172)', date: 'Jun 20, 2024', total: '0.8 Total' },
  ]
  const created: Entry = { route: '68ME → 68ME', tail: 'N1327T (PA32)', date: 'Today', total: '0.8 Total', linked: true }
  const ROW = 1 // the track log being linked
  // Beats, as fractions of the scene.
  const MENU = 0.14, CLICK = 0.26, MODAL = 0.26, TOGGLE = 0.5, FLOW = 0.53, CREATE = 0.72
  const at = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
  const statusOf = (p: number) => (p < CLICK ? 'TRACK LOGS' : p < TOGGLE ? 'SELECT ENTRY' : p < CREATE ? 'LINKED' : 'ENTRY CREATED')

  const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 4) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  }
  // Wireframe placeholder text.
  const bar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => ctx.fillRect(x, y - 3, w, 4)
  const cursor = (ctx: CanvasRenderingContext2D, x: number, y: number, col: SceneCtx['col'], press: number, alpha: number) => {
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.translate(x, y)
    ctx.scale(1 - press * 0.15, 1 - press * 0.15)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 15)
    ctx.lineTo(4, 11)
    ctx.lineTo(7, 17)
    ctx.lineTo(9, 16)
    ctx.lineTo(6, 10)
    ctx.lineTo(11, 10)
    ctx.closePath()
    ctx.fillStyle = col(WHITE, 1)
    ctx.fill()
    ctx.restore()
  }

  return {
    slug: 'foreflight',
    title: 'ForeFlight',
    meta: 'Software Engineering · 2024',
    tags: 'TRACK LOGS / LOGBOOK / WEB APP',
    readouts: ({ p }) => [
      ['TRACK LOG', 'KAUS → KHYI'],
      ['TOTAL', '1.6 HRS'],
      ['STATUS', statusOf(p)],
    ],
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      ctx.lineWidth = 1
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2
      // Both windows are sized to their content and centred as a pair: the app on the left, the
      // picker beside it. Narrow frames get the picker alone.
      const narrow = box.w < 880
      // Wide frames keep a margin above and below, clear of the HUD; phones need every pixel. Rows
      // never squash below legibility: on short frames the list just scrolls under the footer.
      const room = box.h - (narrow ? 0 : 24)
      const rowH = Math.max(34, Math.min(44, (room - 190) / 6))
      const mw = narrow ? Math.min(box.w, 460) : 430, mh = Math.min(room, 190 + rowH * 6)
      const gapX = 96
      const ww = narrow ? 0 : Math.min(520, box.w - 40 - gapX - mw)
      const left = cx - (narrow ? mw : ww + gapX + mw) / 2
      // The picker: slides in on the click, and back out as the scene draws itself off.
      const m = at(p, MODAL, MODAL + 0.08) * reveal
      // ---- Web app window: Track Logs ----
      // Centred on its own until the picker arrives, then it glides left to make room for it.
      const tRowH = Math.min(40, rowH * 0.92)
      const wh = 94 + logs.length * tRowH
      const wx = left + (1 - easeInOutCubic(m)) * (gapX + mw) / 2, wy = cy - wh / 2
      const rowY = (i: number) => wy + 78 + i * tRowH
      const colX = [16, 0.2, 0.52, 0.8].map((f, i) => (i === 0 ? wx + f : wx + ww * f))
      if (!narrow) {
        ctx.strokeStyle = col(pal.hi, 0.55)
        rrect(ctx, wx, wy, ww, wh * reveal, 6)
        ctx.stroke()
        // Title bar + nav.
        ctx.beginPath()
        ctx.moveTo(wx, wy + 28)
        ctx.lineTo(wx + ww, wy + 28)
        ctx.stroke()
        ;[0, 1, 2].forEach((k) => {
          ctx.beginPath()
          ctx.arc(wx + 14 + k * 12, wy + 14, 3, 0, TAU)
          ctx.stroke()
        })
        ctx.fillStyle = col(WHITE, 0.9)
        label(ctx, 'Track Logs', wx + 16, wy + 52, 12, 600)
        ctx.fillStyle = col(pal.hi, 0.25)
        bar(ctx, wx + ww - 120, wy + 48, 100)
        // Column heads.
        ctx.fillStyle = col(WHITE, 0.45)
        ;['DATE', 'ROUTE', 'AIRCRAFT', 'HRS'].forEach((h, i) => label(ctx, h, colX[i], wy + 70, 8))
        logs.forEach((row, i) => {
          const a = clamp01(reveal * 1.6 - i * 0.12)
          if (a <= 0) return
          const y = rowY(i)
          const active = i === ROW ? ramp(p, MENU - 0.04, MENU) : 0
          if (active > 0) {
            ctx.fillStyle = col(pal.mid, 0.16 * active)
            ctx.fillRect(wx + 6, y, ww - 12, tRowH - 4)
          }
          ctx.strokeStyle = col(pal.hi, 0.18 * a)
          ctx.beginPath()
          ctx.moveTo(wx + 10, y + tRowH - 2)
          ctx.lineTo(wx + ww - 10, y + tRowH - 2)
          ctx.stroke()
          const ty = y + tRowH / 2 + 3
          ctx.fillStyle = col(WHITE, 0.55 * a)
          label(ctx, row[0], colX[0], ty, 10)
          ctx.fillStyle = col(WHITE, 0.95 * a)
          label(ctx, row[1], colX[1], ty, 10, 600)
          ctx.fillStyle = col(WHITE, 0.6 * a)
          label(ctx, row[2], colX[2], ty, 10)
          label(ctx, row[3], colX[3], ty, 10)
          // Kebab.
          ctx.fillStyle = col(WHITE, 0.6 * a)
          for (let d = -1; d <= 1; d++) ctx.fillRect(wx + ww - 22, ty - 4 + d * 4, 2, 2)
          // Linked badge, once this track log is linked.
          if (i === ROW && p > FLOW + 0.12) {
            const b = at(p, FLOW + 0.12, FLOW + 0.2)
            ctx.strokeStyle = col(pal.hi, b)
            rrect(ctx, colX[2] + 62, ty - 10, 50, 14, 7)
            ctx.stroke()
            ctx.fillStyle = col(pal.hi, b)
            label(ctx, 'LINKED', colX[2] + 70, ty + 1, 8, 600)
          }
        })
        // Kebab menu.
        const menu = at(p, MENU, MENU + 0.05) * (1 - at(p, CLICK + 0.02, CLICK + 0.06))
        if (menu > 0) {
          const mx = wx + ww - 150, my = rowY(ROW) + tRowH - 6
          ctx.fillStyle = col(pal.lo, 1)
          rrect(ctx, mx, my, 132, 78 * menu, 5)
          ctx.fill()
          ctx.strokeStyle = col(WHITE, 0.6)
          ctx.stroke()
          // Items fade in as the menu opens, rather than appearing once it's there.
          const items = clamp01((menu - 0.4) / 0.6)
          if (items > 0) {
            ctx.fillStyle = col(pal.mid, 0.3 * items)
            ctx.fillRect(mx + 4, my + 6, 124, 20)
            ctx.fillStyle = col(WHITE, 0.95 * items)
            label(ctx, 'Link to Logbook', mx + 12, my + 20, 10, 600)
            ctx.fillStyle = col(WHITE, 0.3 * items)
            bar(ctx, mx + 12, my + 44, 70)
            bar(ctx, mx + 12, my + 64, 90)
          }
        }
      }

      // ---- "Add to Logbook" picker, laid out like the final design ----
      const mx = (narrow ? left : left + ww + gapX) + (1 - easeOutCubic(m)) * 40
      const my = cy - mh / 2
      let linkedRow: Pt | null = null
      let toggleAt: Pt = [mx + 30, my + 200]
      let createAt: Pt = [mx + mw / 2, my + mh - 40]
      if (m > 0) {
        // Relative to the scene's own fade (see drawScene).
        const sceneAlpha = ctx.globalAlpha
        ctx.globalAlpha = sceneAlpha * m
        ctx.fillStyle = col(pal.lo, 1)
        rrect(ctx, mx, my, mw, mh, 8)
        ctx.fill()
        ctx.strokeStyle = col(WHITE, 0.7)
        ctx.stroke()
        // Title bar.
        ctx.beginPath()
        ctx.moveTo(mx, my + 36)
        ctx.lineTo(mx + mw, my + 36)
        ctx.stroke()
        ctx.fillStyle = col(WHITE, 0.95)
        ctx.textAlign = 'center'
        label(ctx, 'Add to Logbook', mx + mw / 2, my + 23, 11, 600)
        ctx.textAlign = 'left'
        ctx.strokeStyle = col(WHITE, 0.55)
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(mx + mw - 24, my + 14)
        ctx.lineTo(mx + mw - 16, my + 22)
        ctx.moveTo(mx + mw - 16, my + 14)
        ctx.lineTo(mx + mw - 24, my + 22)
        ctx.stroke()
        ctx.lineWidth = 1
        ctx.fillStyle = col(WHITE, 0.95)
        label(ctx, 'Select a Logbook entry', mx + 18, my + 62, 13, 600)

        // The recommended entry's link eases on (button, glyph and tag crossfade together).
        const toggled = ramp(p, TOGGLE - 0.01, TOGGLE + 0.04)
        const madeNew = at(p, CREATE, CREATE + 0.06)
        let y = my + 78
        const strip = (text: string) => {
          ctx.fillStyle = col(pal.hi, 0.1)
          ctx.fillRect(mx + 1, y, mw - 2, 22)
          ctx.fillStyle = col(WHITE, 0.6)
          label(ctx, text, mx + 18, y + 15, 9, 600)
          y += 22
        }
        const row = (e: Entry, linked: number, highlight: number, grow = 1) => {
          const h = rowH * grow
          if (h < 2) return null
          ctx.save()
          ctx.beginPath()
          ctx.rect(mx, y, mw, h)
          ctx.clip()
          if (highlight > 0) {
            ctx.fillStyle = col(pal.mid, 0.2 * highlight)
            ctx.fillRect(mx + 1, y, mw - 2, h)
          }
          // Link / unlink button on the left.
          const cx = mx + 30, cy = y + rowH / 2
          ctx.beginPath()
          ctx.arc(cx, cy, 10, 0, TAU)
          ctx.fillStyle = col(mix(WHITE, pal.mid, linked), 0.16 + 0.19 * linked)
          ctx.fill()
          ctx.lineWidth = 1.6
          if (linked < 1) {
            // Link glyph: a plus, turning as it hands over to the unlink glyph.
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(linked * Math.PI * 0.25)
            ctx.strokeStyle = col(WHITE, 0.9 * (1 - linked))
            ctx.beginPath()
            ctx.moveTo(-5, 0)
            ctx.lineTo(5, 0)
            ctx.moveTo(0, -5)
            ctx.lineTo(0, 5)
            ctx.stroke()
            ctx.restore()
          }
          if (linked > 0) {
            // Unlink glyph: two broken chain halves.
            ctx.strokeStyle = col(pal.hi, 0.9 * linked)
            ctx.beginPath()
            ctx.arc(cx - 3, cy + 3, 3, Math.PI * 0.5, Math.PI * 1.5)
            ctx.moveTo(cx + 3, cy - 6)
            ctx.arc(cx + 3, cy - 3, 3, -Math.PI * 0.5, Math.PI * 0.5)
            ctx.stroke()
          }
          ctx.lineWidth = 1
          // What: route, tail, and the Linked / Just created tag.
          const tx = mx + 50
          ctx.fillStyle = col(WHITE, 0.95)
          label(ctx, e.route, tx, cy - 3, 11, 600)
          ctx.fillStyle = col(WHITE, 0.5)
          label(ctx, e.tail, tx, cy + 12, 9)
          if (linked > 0) {
            const tag = e === created ? 'Just created' : 'Linked'
            ctx.font = '600 8px "Open Sauce One", system-ui, sans-serif'
            const tw = ctx.measureText(tag).width + 12
            const gx = tx + ctx.measureText(e.tail).width + 42
            ctx.strokeStyle = col(pal.hi, 0.9 * linked)
            rrect(ctx, gx, cy + 3, tw, 13, 6.5)
            ctx.stroke()
            ctx.fillStyle = col(pal.hi, linked)
            label(ctx, tag, gx + 6, cy + 12.5, 8, 600)
          }
          // When: date over total, right-aligned.
          ctx.textAlign = 'right'
          ctx.fillStyle = col(WHITE, 0.55)
          label(ctx, e.date, mx + mw - 20, cy - 3, 9)
          ctx.fillStyle = col(WHITE, 0.85)
          label(ctx, e.total, mx + mw - 20, cy + 12, 9)
          ctx.textAlign = 'left'
          ctx.restore()
          ctx.strokeStyle = col(pal.hi, 0.14)
          ctx.beginPath()
          ctx.moveTo(mx + 12, y + h)
          ctx.lineTo(mx + mw - 12, y + h)
          ctx.stroke()
          const at0: Pt = [cx, cy]
          y += h
          return at0
        }
        // The list scrolls under the footer, like the real picker: clip it above the button.
        ctx.save()
        ctx.beginPath()
        ctx.rect(mx, my + 78, mw, mh - 78 - 60)
        ctx.clip()
        strip('Recent Entries')
        if (madeNew > 0) row(created, 1, 0, easeOutCubic(madeNew))
        recent.forEach((e) => row(e, e.linked ? 1 : 0, 0))
        strip('Recommended Entries')
        recommended.forEach((e, k) => {
          const at0 = row(e, k === 0 ? toggled : 0, k === 0 ? ramp(p, TOGGLE - 0.06, TOGGLE) * (1 - ramp(p, CREATE - 0.04, CREATE + 0.02)) : 0)
          if (k === 0 && at0) {
            toggleAt = at0
            linkedRow = [mx + 12, at0[1]]
          }
        })
        ctx.restore()
        // Scrollbar.
        const sy0 = my + 78, sh = mh - 78 - 64
        ctx.fillStyle = col(WHITE, 0.08)
        ctx.fillRect(mx + mw - 6, sy0, 2, sh)
        ctx.fillStyle = col(WHITE, 0.4)
        ctx.fillRect(mx + mw - 6, sy0 + madeNew * 8, 2, sh * 0.62)
        // Create New Entry.
        const by = my + mh - 50
        createAt = [mx + mw / 2 + 50, by + 16]
        const press = pulse(p, CREATE)
        ctx.strokeStyle = col(pal.hi, 0.9)
        rrect(ctx, mx + 18, by, mw - 36, 32, 6)
        ctx.stroke()
        if (press > 0) {
          ctx.fillStyle = col(pal.hi, 0.15 * press)
          ctx.fill()
        }
        ctx.fillStyle = col(pal.hi, 1)
        ctx.textAlign = 'center'
        label(ctx, 'Create New Entry', mx + mw / 2, by + 20, 10, 600)
        ctx.textAlign = 'left'
        ctx.globalAlpha = sceneAlpha
      }

      // ---- The link: telemetry travelling from the track log into the entry ----
      if (!narrow && linkedRow && p > FLOW) {
        const f = at(p, FLOW, FLOW + 0.14) * reveal
        const from: Pt = [wx + ww, rowY(ROW) + tRowH / 2]
        const to: Pt = linkedRow
        const path = spline([from, [from[0] + (to[0] - from[0]) * 0.5, from[1]], [from[0] + (to[0] - from[0]) * 0.5, to[1]], to], 20)
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = col(pal.hi, 0.8)
        if (f > 0) strokeTo(ctx, path, f)
        ctx.setLineDash([])
        // Data flows along it once it's connected, fading up rather than switching on.
        const flow = ramp(p, FLOW + 0.12, FLOW + 0.17) * reveal
        for (let k = 0; flow > 0 && k < 4; k++) {
          const u = (t * 0.6 + k / 4) % 1
          const pt = path[Math.floor(u * (path.length - 1))]
          ctx.fillStyle = col(WHITE, 0.9 * flow)
          ctx.fillRect(pt[0] - 1.5, pt[1] - 1.5, 3, 3)
        }
      }

      // ---- Cursor: kebab -> "Link to Logbook" -> recommended entry's toggle ----
      // Fades in at the start and out after the last click, instead of popping.
      const cursorIn = ramp(p, 0.03, 0.08) * (1 - ramp(p, CREATE + 0.04, CREATE + 0.1))
      if (!narrow && cursorIn > 0) {
        const kebab: Pt = [wx + ww - 21, rowY(ROW) + tRowH / 2]
        const item: Pt = [wx + ww - 110, rowY(ROW) + tRowH + 10]
        const start: Pt = [wx + ww * 0.6, wy + wh * 0.8]
        let c: Pt
        if (p < MENU) c = lerpPt(start, kebab, easeInOutCubic(at(p, 0.06, MENU)))
        else if (p < CLICK) c = lerpPt(kebab, item, easeInOutCubic(at(p, MENU + 0.04, CLICK - 0.02)))
        else if (p < TOGGLE + 0.02) c = lerpPt(item, toggleAt, easeInOutCubic(at(p, CLICK + 0.08, TOGGLE - 0.02)))
        else c = lerpPt(toggleAt, createAt, easeInOutCubic(at(p, FLOW + 0.04, CREATE - 0.02)))
        const press = Math.max(pulse(p, MENU), pulse(p, CLICK), pulse(p, TOGGLE), pulse(p, CREATE))
        cursor(ctx, c[0], c[1], col, press, cursorIn)
      }
    },
  }
})()

const lerpPt = (a: Pt, b: Pt, u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
/** 0..1..0 blip around a moment in the scene (a click). */
const pulse = (p: number, at: number) => Math.max(0, 1 - Math.abs(p - at) / 0.02)

const whoOwnsSeattle: Scene = (() => {
  // A 5 x 4 block of office towers: a handful of shapes, with floor lines for detail.
  const cols = 5, rows = 4
  const rnd = seeded(21)
  const base = Array.from({ length: cols * rows }, (_, n) => {
    const i = n % cols, j = Math.floor(n / cols)
    // Taller toward the middle of the block, like a downtown core.
    const core = 1 - Math.hypot(i - (cols - 1) / 2, j - (rows - 1) / 2) / 3.2
    return 0.25 + 0.75 * clamp01(core * 0.8 + rnd() * 0.45)
  })
  // Highest roof above the grid's origin, in lots (for centring the block vertically).
  const TOP = Math.min(-0.5, ...base.map((b, n) => ((n % cols) + Math.floor(n / cols)) * 0.5 - b * 3.4 - 0.31))
  const yearAt = (p: number) => 1990 + Math.floor(clamp01(p * 1.15) * 35)
  return {
    title: 'Who Owns Seattle',
    meta: 'Data Visualization · 2025',
    tags: 'KING COUNTY RECORDS / PARCELS / OWNERSHIP',
    readouts: ({ p }) => [
      ['YEAR', String(yearAt(p))],
      ['PARCELS', '1,284'],
      ['TOP OWNER', `${Math.round(18 + p * 21)}%`],
    ],
    draw: ({ ctx, box, p, reveal, col, pal }) => {
      const span = cols + rows
      // The block and its legend are centred together; the year scrubber runs under the block.
      // The street grid is span lots wide; narrow frames drop the legend.
      const s = Math.min(box.h / 8.6, box.w / 9.6)
      const legendW = 120, legendGap = 56
      const legend = box.w >= span * s + legendW + legendGap + 40
      const lead = legend ? legendW + legendGap : 0
      const gx = box.x + (box.w - span * s - lead) / 2 + lead // the street grid's left corner
      const ox = gx + rows * s
      const oy = box.y + box.h / 2 - ((TOP + 4) * s + 44) / 2
      const k = s * 0.62 // footprint half-width; the rest of the lot is street
      const year = yearAt(p)
      // Continuous years, so each tower's owner can crossfade instead of snapping.
      const years = clamp01(p * 1.15) * 35
      const owners = [pal.hi, pal.mid, WHITE]
      ctx.lineWidth = 1
      // Street grid.
      ctx.strokeStyle = col(pal.hi, 0.14)
      ctx.beginPath()
      for (let i = -0.5; i <= cols - 0.5; i++) {
        ctx.moveTo(ox + (i + 0.5) * s, oy + (i - 0.5) * s * 0.5)
        ctx.lineTo(ox + (i + 0.5 - rows) * s, oy + (i - 0.5 + rows) * s * 0.5)
      }
      for (let j = -0.5; j <= rows - 0.5; j++) {
        ctx.moveTo(ox - (j + 0.5) * s, oy + (j - 0.5) * s * 0.5)
        ctx.lineTo(ox + (cols - j - 0.5) * s, oy + (cols + j - 0.5) * s * 0.5)
      }
      ctx.stroke()
      // Towers, back to front.
      for (let d = 0; d < span - 1; d++) {
        for (let i = 0; i < cols; i++) {
          const j = d - i
          if (j < 0 || j >= rows) continue
          const b = base[j * cols + i]
          const rise = easeOutExpo(clamp01(reveal * 1.8 - d * 0.09))
          const H = b * s * 3.4 * rise
          // Parcels change hands every 8 years (staggered across the block), blending over the last fifth.
          const era = (years + i * 3 + j * 2) / 8
          const o = Math.floor(b * 7) + Math.floor(era)
          const owner = mix(owners[o % 3], owners[(o + 1) % 3], ramp(era % 1, 0.8, 1))
          const X = ox + (i - j) * s, Y = oy + (i + j) * s * 0.5
          const W: Pt = [X - k, Y], S: Pt = [X, Y + k * 0.5], E: Pt = [X + k, Y], N: Pt = [X, Y - k * 0.5]
          // Left and right faces.
          ctx.beginPath()
          ctx.moveTo(W[0], W[1] - H)
          ctx.lineTo(W[0], W[1])
          ctx.lineTo(S[0], S[1])
          ctx.lineTo(S[0], S[1] - H)
          ctx.closePath()
          ctx.fillStyle = col(owner, 0.16)
          ctx.fill()
          ctx.beginPath()
          ctx.moveTo(S[0], S[1] - H)
          ctx.lineTo(S[0], S[1])
          ctx.lineTo(E[0], E[1])
          ctx.lineTo(E[0], E[1] - H)
          ctx.closePath()
          ctx.fillStyle = col(owner, 0.08)
          ctx.fill()
          // Floors, one line every 7px up both faces.
          ctx.beginPath()
          for (let f = 7; f < H - 2; f += 7) {
            ctx.moveTo(W[0], W[1] - f)
            ctx.lineTo(S[0], S[1] - f)
            ctx.lineTo(E[0], E[1] - f)
          }
          ctx.strokeStyle = col(owner, 0.3)
          ctx.stroke()
          // Roof + edges.
          ctx.beginPath()
          ctx.moveTo(N[0], N[1] - H)
          ctx.lineTo(E[0], E[1] - H)
          ctx.lineTo(S[0], S[1] - H)
          ctx.lineTo(W[0], W[1] - H)
          ctx.closePath()
          ctx.fillStyle = col(owner, 0.35)
          ctx.fill()
          ctx.moveTo(W[0], W[1] - H)
          ctx.lineTo(W[0], W[1])
          ctx.lineTo(S[0], S[1])
          ctx.lineTo(E[0], E[1])
          ctx.lineTo(E[0], E[1] - H)
          ctx.moveTo(S[0], S[1])
          ctx.lineTo(S[0], S[1] - H)
          ctx.strokeStyle = col(owner, 0.9)
          ctx.stroke()
        }
      }
      // Legend, level with the block's left corner.
      if (legend) {
        const lx = gx - legendGap - legendW, ly = oy + (rows - 1) * s * 0.5 - 18
        ctx.fillStyle = col(WHITE, 0.6)
        label(ctx, 'OWNERSHIP BY PARCEL', lx, ly - 18, 9)
        ;['DEVELOPER', 'TRUST', 'PUBLIC'].forEach((name, n) => {
          ctx.fillStyle = col(owners[n], 0.9)
          ctx.fillRect(lx, ly + n * 22, 10, 10)
          ctx.fillStyle = col(WHITE, 0.75)
          label(ctx, name, lx + 18, ly + n * 22 + 9, 9)
        })
      }
      // Year scrubber, centred under the block.
      const sw = s * 5, sx = ox + s * 0.5 - sw / 2, sy = oy + 4 * s + 40
      ctx.strokeStyle = col(pal.hi, 0.35)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + sw * reveal, sy)
      for (let n = 0; n <= 7; n++) {
        ctx.moveTo(sx + (sw * n) / 7, sy - 3)
        ctx.lineTo(sx + (sw * n) / 7, sy + 3)
      }
      ctx.stroke()
      const kx = sx + sw * clamp01(p * 1.15)
      ctx.fillStyle = col(WHITE, 1)
      ctx.fillRect(kx - 1, sy - 8, 2, 16)
      label(ctx, String(year), kx - 12, sy - 14, 9)
    },
  }
})()

const projectOpen: Scene = (() => {
  // Traced from the Project Open prototype: a bandless hook over the top and down the back of the
  // ear, a round open-back cup hung in front of it from a knuckle, a bar running from the cup back
  // across the ear, and a ball at each end (one off the back of the hook, one under the lobe).
  // Drawn worn on a right ear, seen from the side with the face to the right. The story:
  //   draw on -> explode the cup's parts out along its axis, with callouts -> reassemble -> the
  //   ear draws in under the piece and the cup turns see-through (it's open-back), with ambient
  //   sound reaching the canal while the cup plays.
  // Each beat overlaps the next, so the piece never stops moving between them.
  const EXPLODE = [0.08, 0.3] as const
  const COLLAPSE = [0.48, 0.62] as const
  const EAR = [0.56, 0.76] as const
  const SOUND = [0.68, 0.82] as const
  const phaseOf = (p: number) => (p < COLLAPSE[0] ? 'EXPLODED VIEW' : p < EAR[0] + 0.04 ? 'ASSEMBLING' : 'OPEN EAR')

  // Geometry in ear units: origin mid-ear, u toward the face, v down; 1 = half the ear's height.
  const ear = {
    // Helix and lobe: from where the rim leaves the cheek, over the top, down the back, round the lobe.
    outline: spline([
      [0.2, -0.4], [0.3, -0.62], [0.26, -0.86], [0.08, -1.0], [-0.18, -1.03], [-0.44, -0.9], [-0.62, -0.64], [-0.69, -0.32],
      [-0.66, -0.02], [-0.57, 0.26], [-0.45, 0.48], [-0.36, 0.68], [-0.22, 0.86], [-0.04, 0.92], [0.09, 0.83], [0.13, 0.62],
    ], 10),
    // Where the ear meets the cheek: not drawn, just closes the silhouette through the tragus.
    front: spline([[0.13, 0.62], [0.1, 0.46], [0.18, 0.3], [0.24, 0.06], [0.24, -0.2], [0.2, -0.4]], 8),
    // The rim's inner fold, running on from the crus of the helix inside the concha.
    rim: spline([
      [0.02, -0.14], [0.13, -0.32], [0.18, -0.58], [0.08, -0.82], [-0.14, -0.92], [-0.4, -0.82], [-0.56, -0.58],
      [-0.61, -0.3], [-0.57, -0.02], [-0.48, 0.24], [-0.38, 0.44],
    ], 10),
    // Antihelix, from the antitragus up into its upper crus, which tucks under the rim.
    antihelix: spline([[-0.12, 0.4], [-0.3, 0.22], [-0.4, -0.02], [-0.4, -0.3], [-0.28, -0.56], [-0.1, -0.72], [0.04, -0.76]], 10),
    // Its lower crus, forking forward over the concha (the triangular fossa sits between the two).
    crus: spline([[-0.39, -0.32], [-0.2, -0.44], [0.06, -0.48]], 10),
    // The concha: its back wall, curling under into the antitragus and the notch...
    concha: spline([[-0.1, -0.28], [-0.24, -0.06], [-0.22, 0.18], [-0.1, 0.34], [0.05, 0.4]], 10),
    // ...and the bowl it walls in, shaded deeper than the rest of the ear.
    bowl: spline([
      [0.04, -0.16], [-0.1, -0.28], [-0.24, -0.06], [-0.22, 0.18], [-0.1, 0.34], [0.05, 0.4], [0.12, 0.32], [0.14, 0.14],
      [0.1, -0.02], [0.04, -0.16],
    ], 10),
    tragus: spline([[0.05, 0.42], [0.12, 0.34], [0.14, 0.18], [0.17, 0.04], [0.24, -0.02]], 10),
  }
  const CANAL: Pt = [0.03, 0.16]
  // The piece, as worn. The cup hangs just forward of the canal from the knuckle.
  const CUP: Pt = [0.56, 0.02], CUP_R = 0.46
  const KNUCKLE: Pt = [0.44, -0.6]
  const BALL_BACK: Pt = [-1.02, -0.46], BALL_LOW: Pt = [-0.04, 1.12]
  // The hook hugs the ear: up from the knuckle, over the top, down the back to meet the bar.
  const hook = spline([KNUCKLE, [0.38, -0.9], [0.14, -1.1], [-0.18, -1.13], [-0.48, -1.0], [-0.68, -0.72], [-0.76, -0.36], [-0.74, 0.0], [-0.7, 0.3]], 16)
  // The bar runs from under the cup back across the ear, its end standing proud of the hook.
  const bar = spline([[-0.98, 0.34], [-0.7, 0.33], [-0.3, 0.36], [0.22, 0.3]], 16)
  // The lower arm comes out from under the cup and round beneath the lobe to its ball.
  const lowArm = spline([[0.46, 0.44], [0.38, 0.78], [0.18, 1.02], BALL_LOW], 16)
  const backStem: Pt[] = [[-0.74, -0.46], BALL_BACK]
  // Exploded, the parts fan out from the cup's rim GAP apart, and the whole group (SPAN wide, in
  // ear units) slides left to stay centred.
  const GAP = 0.5, SPAN = 5.5

  type Part = { label: string; draw: (ctx: CanvasRenderingContext2D, x: number, y: number, R: number) => void }
  const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU)
    ctx.stroke()
  }
  // Nearest the cup first; the grille, the outermost layer, travels furthest.
  const parts: Part[] = [
    {
      label: 'CELL',
      draw: (ctx, x, y, R) => {
        ctx.beginPath()
        ctx.moveTo(x - R * 0.2, y - R * 0.3)
        ctx.lineTo(x + R * 0.12, y - R * 0.42)
        ctx.lineTo(x + R * 0.2, y + R * 0.3)
        ctx.lineTo(x - R * 0.12, y + R * 0.42)
        ctx.closePath()
        ctx.stroke()
      },
    },
    {
      label: 'PCB',
      draw: (ctx, x, y, R) => {
        ctx.beginPath()
        ctx.moveTo(x - R * 0.18, y - R * 0.5)
        ctx.lineTo(x + R * 0.14, y - R * 0.62)
        ctx.lineTo(x + R * 0.18, y + R * 0.5)
        ctx.lineTo(x - R * 0.14, y + R * 0.62)
        ctx.closePath()
        for (let k = -2; k <= 2; k++) {
          ctx.moveTo(x - R * 0.1, y + k * R * 0.18)
          ctx.lineTo(x + R * 0.08, y + k * R * 0.18 - R * 0.04)
        }
        ctx.stroke()
      },
    },
    {
      label: 'COIL',
      draw: (ctx, x, y, R) => {
        for (let k = 1; k <= 4; k++) ring(ctx, x, y, R * 0.07 * k, R * 0.15 * k)
      },
    },
    {
      label: 'DAMPING FOAM',
      draw: (ctx, x, y, R) => {
        for (let k = 0; k < 3; k++) ctx.strokeRect(x - R * 0.2 + k * R * 0.17, y - R * 0.55, R * 0.1, R * 1.1)
      },
    },
    {
      label: 'CONE',
      draw: (ctx, x, y, R) => {
        ring(ctx, x, y, R * 0.46, R * 1.08)
        ring(ctx, x + R * 0.22, y, R * 0.16, R * 0.38)
        ctx.beginPath()
        for (const d of [-1, 1]) {
          ctx.moveTo(x, y + d * R * 1.08)
          ctx.lineTo(x + R * 0.22, y + d * R * 0.38)
        }
        ctx.stroke()
      },
    },
    {
      label: '40MM DRIVER',
      draw: (ctx, x, y, R) => {
        ring(ctx, x, y, R * 0.36, R * 0.95)
        ring(ctx, x + R * 0.3, y, R * 0.24, R * 0.62)
        ctx.beginPath()
        ctx.moveTo(x, y - R * 0.95)
        ctx.lineTo(x + R * 0.3, y - R * 0.62)
        ctx.moveTo(x, y + R * 0.95)
        ctx.lineTo(x + R * 0.3, y + R * 0.62)
        ctx.stroke()
        ;[-1, 1].forEach((d) => ring(ctx, x - R * 0.12, y + d * R * 1.12, 3, 3))
      },
    },
    {
      label: 'GRILLE',
      draw: (ctx, x, y, R) => {
        ring(ctx, x, y, R * 0.42, R)
        // Perforation, foreshortened like the disc.
        for (let r = 0.25; r < 0.9; r += 0.2) {
          const n = Math.round(r * 22)
          for (let k = 0; k < n; k++) {
            const a = (k / n) * TAU
            ctx.fillRect(x + Math.cos(a) * r * R * 0.42 - 1, y + Math.sin(a) * r * R - 1, 2, 2)
          }
        }
      },
    },
  ]

  return {
    title: 'Project Open',
    meta: 'Interaction Design · 2025',
    tags: 'OPEN-EAR AUDIO / BANDLESS / 3D MODELING',
    readouts: ({ p }) => [
      ['FIT TESTS', '30+'],
      ['EARS MAPPED', '90'],
      ['VIEW', phaseOf(p)],
    ],
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2
      const e = ramp(p, EXPLODE[0], EXPLODE[1]) * (1 - ramp(p, COLLAPSE[0], COLLAPSE[1])) // 0 assembled .. 1 exploded
      const S0 = Math.min(box.h * 0.27, box.w * 0.27)
      // Narrow frames shrink the piece on its way out, so the exploded row still fits.
      const fit = Math.min(1, (box.w * 0.94) / (SPAN * S0))
      const S = S0 * (1 + (fit - 1) * e)
      // Assembled (and worn), the piece and ear are centred; exploded, the piece and its parts are.
      const ox = cx + S * (0.08 - 1.655 * e), oy = cy - S * 0.04
      const P = ([u, v]: Pt): Pt => [ox + u * S, oy + v * S]
      const map = (pts: Pt[]) => pts.map(P)
      const [ux, uy] = P(CUP)
      const float = Math.sin(t * 1.4) * 3 * e
      // The ear draws in (and, at the handoff, back out) with the scene.
      const earIn = ramp(p, EAR[0], EAR[1]) * reveal
      ctx.lineWidth = 1

      // ---- Exploded view ----
      const Rp = S * 0.34
      const partX = (k: number) => ux + (CUP_R + 0.16 + k * GAP) * S * e
      if (e > 0.01) {
        ctx.setLineDash([2, 5])
        ctx.strokeStyle = col(pal.hi, 0.35 * e)
        ctx.beginPath()
        ctx.moveTo(ux, uy)
        ctx.lineTo(partX(parts.length - 1) + S * 0.4 * e, uy)
        ctx.stroke()
        ctx.setLineDash([])
      }
      // Parts ride out of the cup along the axis, then home again; the cup (drawn over them) hides
      // each one until it's clear of the rim.
      parts.forEach((part, k) => {
        const x = partX(k)
        const y = uy + (k % 2 ? float : -float)
        const a = clamp01((x - ux - CUP_R * S) / (S * 0.2))
        if (a <= 0) return
        ctx.strokeStyle = col(k % 2 ? pal.hi : WHITE, 0.85 * a)
        ctx.fillStyle = col(pal.hi, 0.85 * a)
        part.draw(ctx, x, y, Rp)
        // Callout, when there's room between the parts for the labels.
        const c = clamp01((e - 0.7) / 0.3)
        if (c > 0 && GAP * S >= 44) {
          const ly = uy - Rp * 1.25 - 14 - (k % 2) * 16
          ctx.strokeStyle = col(WHITE, 0.4 * c)
          ctx.beginPath()
          ctx.moveTo(x, y - Rp * 1.16)
          ctx.lineTo(x, ly + 4)
          ctx.stroke()
          ctx.fillStyle = col(WHITE, 0.8 * c)
          ctx.textAlign = 'center'
          label(ctx, part.label, x, ly, 9)
          ctx.textAlign = 'left'
        }
      })

      // ---- The ear, drawn in under the piece as it comes back together ----
      const [kx, ky] = P(CANAL)
      const drawEar = () => {
        const outline = map(ear.outline)
        const shape = (pts: Pt[]) => {
          ctx.beginPath()
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
          ctx.closePath()
        }
        // A solid silhouette, so the ear reads as a shape and not a tangle over the dot grid, with
        // the concha shaded in as a hollow.
        shape([...outline, ...map(ear.front)])
        ctx.fillStyle = col(pal.lo, earIn)
        ctx.fill()
        ctx.fillStyle = col(pal.mid, 0.14 * earIn)
        ctx.fill()
        shape(map(ear.bowl))
        ctx.fillStyle = col(pal.lo, 0.75 * earIn)
        ctx.fill()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 1.6
        ctx.strokeStyle = col(WHITE, 0.95)
        strokeTo(ctx, outline, earIn)
        // The folds follow the rim in, each a beat behind the last.
        ctx.lineWidth = 1
        const fold = (pts: Pt[], a: number, lag: number) => {
          const f = clamp01((earIn - lag) / (1 - lag))
          if (f <= 0) return
          ctx.strokeStyle = col(WHITE, a)
          strokeTo(ctx, map(pts), f)
        }
        fold(ear.rim, 0.7, 0.1)
        fold(ear.antihelix, 0.6, 0.2)
        fold(ear.crus, 0.5, 0.3)
        fold(ear.concha, 0.45, 0.3)
        fold(ear.tragus, 0.85, 0.25)
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        // The canal, left clear.
        ctx.beginPath()
        ctx.ellipse(kx, ky, S * 0.045, S * 0.065, -0.3, 0, TAU)
        ctx.fillStyle = col(WHITE, 0.18 * earIn)
        ctx.fill()
        ctx.strokeStyle = col(WHITE, 0.7 * earIn)
        ctx.stroke()
      }
      if (earIn > 0) drawEar()

      // ---- The piece ----
      // Hook, bar and arms are tubes: a wide light stroke with a dark core.
      const tube = (pts: Pt[], width: number) => {
        if (reveal <= 0) return
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = width * S
        ctx.strokeStyle = col(pal.hi, 0.9)
        strokeTo(ctx, pts, reveal)
        ctx.lineWidth = width * S - 2.4
        ctx.strokeStyle = col(pal.lo, 1)
        strokeTo(ctx, pts, reveal)
        ctx.lineCap = 'butt'
        ctx.lineJoin = 'miter'
        ctx.lineWidth = 1
      }
      const ball = (c: Pt, r: number) => {
        const [x, y] = P(c), rr = r * S * reveal
        ctx.beginPath()
        ctx.arc(x, y, rr, 0, TAU)
        ctx.fillStyle = col(pal.lo, 1)
        ctx.fill()
        ctx.strokeStyle = col(pal.hi, 0.9)
        ctx.stroke()
        // A glint, so it reads as a ball rather than a ring.
        ctx.beginPath()
        ctx.arc(x, y, rr * 0.62, Math.PI * 1.05, Math.PI * 1.55)
        ctx.strokeStyle = col(WHITE, 0.55)
        ctx.stroke()
      }
      tube(map(hook), 0.11)
      tube(map(bar), 0.14)
      tube(map(backStem), 0.08)
      tube(map(lowArm), 0.08)
      ball(BALL_BACK, 0.16)
      ball(BALL_LOW, 0.15)
      tube(map([KNUCKLE, [CUP[0] - 0.04, CUP[1] - CUP_R + 0.04]]), 0.1)
      ball(KNUCKLE, 0.12)

      // Cup: a shallow dome, angled a touch forward, so a sliver of its wall shows on the ear side.
      const r = CUP_R * S * reveal
      const wall = r * 0.1
      ctx.beginPath()
      ctx.arc(ux - wall, uy, r, 0, TAU)
      ctx.fillStyle = col(pal.lo, 1)
      ctx.fill()
      ctx.strokeStyle = col(pal.hi, 0.6)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ux - wall, uy - r)
      ctx.lineTo(ux, uy - r)
      ctx.moveTo(ux - wall, uy + r)
      ctx.lineTo(ux, uy + r)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(ux, uy, r, 0, TAU)
      ctx.fillStyle = col(pal.lo, 1)
      ctx.fill()
      // Once worn, its face turns see-through to the ear behind it (it's open-back): the ear is
      // drawn again inside it, dimmed, while the arms and bar that run under it stay hidden.
      if (earIn > 0 && r > 0) {
        ctx.save()
        ctx.clip()
        ctx.globalAlpha *= 0.5
        drawEar()
        ctx.restore()
      }
      ctx.beginPath()
      ctx.arc(ux, uy, r, 0, TAU)
      ctx.strokeStyle = col(WHITE, 0.9)
      ctx.stroke()
      // The dome's shoulder, and a glint across its upper edge.
      ctx.strokeStyle = col(pal.hi, 0.45)
      ring(ctx, ux + r * 0.08, uy, r * 0.8, r * 0.8)
      ctx.beginPath()
      ctx.arc(ux + r * 0.08, uy, r * 0.66, Math.PI * 1.08, Math.PI * 1.42)
      ctx.strokeStyle = col(WHITE, 0.4)
      ctx.stroke()
      // The ring on its crown, set forward of centre like the prototype's.
      const [rx, ry] = [ux + r * 0.26, uy - r * 0.02]
      ctx.beginPath()
      ctx.arc(rx, ry, r * 0.3, 0, TAU)
      ctx.arc(rx, ry, r * 0.19, 0, TAU, true)
      ctx.fillStyle = col(pal.hi, 0.18)
      ctx.fill()
      ctx.strokeStyle = col(WHITE, 0.85)
      ring(ctx, rx, ry, r * 0.3, r * 0.3)
      ctx.strokeStyle = col(pal.hi, 0.8)
      ring(ctx, rx, ry, r * 0.19, r * 0.19)

      // ---- Sound: ambient reaching the open canal, audio from the cup ----
      const snd = ramp(p, SOUND[0], SOUND[1]) * reveal
      if (snd > 0) {
        // Ambient: dotted fronts arriving from behind, converging on the canal (brightest mid-flight).
        ctx.setLineDash([2, 4])
        for (let k = 0; k < 4; k++) {
          const f = (t * 0.5 + k / 4) % 1
          ctx.beginPath()
          ctx.arc(kx, ky, S * (0.16 + (1 - f) * 1.2), Math.PI - 0.45, Math.PI + 0.45)
          ctx.strokeStyle = col(pal.hi, snd * 0.8 * Math.sin(f * Math.PI))
          ctx.stroke()
        }
        ctx.setLineDash([])
        // Audio: fronts spreading from the driver, through the open back, toward the canal.
        const aim = Math.atan2(ky - ry, kx - rx)
        for (let k = 0; k < 3; k++) {
          const f = (t * 0.9 + k / 3) % 1
          ctx.beginPath()
          ctx.arc(rx, ry, r * (0.36 + f * 1.1), aim - 0.5, aim + 0.5)
          ctx.strokeStyle = col(WHITE, snd * 0.85 * (1 - f))
          ctx.stroke()
        }
        // The canal lights as it arrives.
        ctx.beginPath()
        ctx.arc(kx, ky, 2.5, 0, TAU)
        ctx.fillStyle = col(WHITE, snd * (0.6 + 0.4 * Math.sin(t * 4)))
        ctx.fill()
        ctx.textAlign = 'center'
        ctx.fillStyle = col(WHITE, 0.6 * snd)
        const [ax, ay] = P([-1.5, 0.14]), [bx, by] = P([1.26, 0.06])
        label(ctx, 'AMBIENT', ax, ay, 9)
        label(ctx, 'AUDIO', bx, by, 9)
        ctx.fillStyle = col(WHITE, 0.9 * snd)
        label(ctx, 'EAR STAYS OPEN', cx, P([0, 1.46])[1], 10, 600)
        ctx.textAlign = 'left'
      }

      // Oscilloscope along the foot, centred.
      const wy = box.y + box.h - 14, ww = Math.min(box.w * 0.46, S * 4), wx = cx - ww / 2
      ctx.beginPath()
      for (let i = 0; i <= 200 * reveal; i++) {
        const u = i / 200
        const Y = wy + Math.sin(u * 40 + t * 8) * 6 * Math.sin(u * Math.PI) + Math.sin(u * 13 - t * 3) * 3 * Math.sin(u * Math.PI)
        i ? ctx.lineTo(wx + u * ww, Y) : ctx.moveTo(wx, Y)
      }
      ctx.strokeStyle = col(pal.hi, 0.8)
      ctx.stroke()
    },
  }
})()

const SCENES: Scene[] = [xbox, foreflight, whoOwnsSeattle, projectOpen]

// ---------- Engine ----------

/**
 * bottomPad: a band at the foot kept clear of the HUD and the scenes, for when the page fades
 * the canvas out at the bottom edge.
 */
export function createReel(canvas: HTMLCanvasElement, { bottomPad = 0 } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let w = 0, h = 0, dpr = 1

  const col = (c: RGB, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`

  const drawScene = (scene: Scene, local: number, stage: Stage, pal: Palette) => {
    // A scene's clock starts at the handoff that brings it in; `left` counts down to the end of
    // the one that takes it out.
    const left = LIFE_SECONDS - local
    const s: SceneCtx = {
      ctx,
      box: stage.box,
      t: local,
      // The scene's beats run across the time it's actually on screen (from SHOWN into its
      // handoff in to SHOWN before the end of its handoff out).
      p: clamp01((local - SHOWN_SECONDS) / (LIFE_SECONDS - 2 * SHOWN_SECONDS)),
      // Draws on as it arrives, then off again (the same motion reversed) as it leaves.
      reveal: easeOutCubic(clamp01((local - 0.55) / 1.4)) * easeInOutCubic(clamp01((left - 0.55) / 0.95)),
      col,
      pal,
    }
    // Whatever doesn't draw on and off fades instead: the leaving scene is all but gone before the
    // arriving one comes up, so the two only cross faintly at the midpoint. With a slow push
    // through the handoff (the arriving scene settles in from a touch small, the leaving one
    // drifts a touch large) they read as one continuous move rather than a cut.
    const alpha = ramp(local, 0.5, 1.1) * ramp(left, 0.5, 1.3)
    if (alpha <= 0) return s
    const zoom =
      1 - 0.05 * (1 - easeOutCubic(clamp01(local / HANDOFF_SECONDS))) + 0.05 * (1 - easeOutCubic(clamp01(left / HANDOFF_SECONDS)))
    const { w: bw, h: bh } = stage.box
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(stage.x, stage.y)
    ctx.scale(stage.k, stage.k)
    ctx.translate(bw / 2, bh / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-bw / 2, -bh / 2)
    scene.draw(s)
    ctx.restore()
    return s
  }

  return {
    /** The case study slug for whatever is on screen at this time (if it has one). */
    currentSlug(time: number) {
      // The HUD switches to the next project halfway through the handoff, so this does too.
      const cycle = SCENES.length * SCENE_SECONDS
      const tt = (((time + HANDOFF_SECONDS / 2) % cycle) + cycle) % cycle
      return SCENES[Math.floor(tt / SCENE_SECONDS)].slug
    },

    resize(width: number, height: number, ratio: number) {
      w = width
      h = height
      dpr = ratio
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    },

    draw(time: number, pal: Palette, pointer: Pointer) {
      if (!w || !h) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = col(pal.lo)
      ctx.fillRect(0, 0, w, h)
      ctx.textBaseline = 'alphabetic'

      const m = Math.max(20, Math.min(36, w * 0.028))
      // Dot grid; dots near the pointer light up.
      const gap = 22
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const d = Math.hypot(x - pointer.x, y - pointer.y)
          const a = 0.07 + 0.5 * Math.max(0, 1 - d / 150)
          ctx.fillStyle = col(pal.hi, a)
          ctx.fillRect(x, y, 1, 1)
        }
      }

      const cycle = SCENES.length * SCENE_SECONDS
      const tt = ((time % cycle) + cycle) % cycle
      const idx = Math.floor(tt / SCENE_SECONDS)
      // phase: where we are in this scene's slot. local: the scene's own clock, which began at the
      // handoff that brought it in, a handoff's length before its slot. The very first scene on
      // load had no handoff, so its clock runs a little fast to fit its whole life into the slot.
      const phase = tt - idx * SCENE_SECONDS
      const local = time < SCENE_SECONDS ? phase * (LIFE_SECONDS / SCENE_SECONDS) : phase + HANDOFF_SECONDS
      const next = (idx + 1) % SCENES.length
      // The stage: the space between the HUD's top and bottom bands, where each scene composes
      // itself around the centre. Big frames scale the scenes up (to 1.5x) instead of spreading
      // them out, and very wide ones just get more margin, so the work stays gathered in the middle.
      const aw = w - 2 * m - 16, ah = h - bottomPad - 2 * m - 130
      const k = Math.min(1.5, Math.max(1, ah / 600))
      const bh = ah / k, bw = Math.min(aw / k, bh * 2.3)
      const stage: Stage = { x: m + 8 + (aw - bw * k) / 2, y: m + 44, k, box: { x: 0, y: 0, w: bw, h: bh } }

      // The art drifts slightly against the pointer.
      const px = pointer.x > -999 ? (pointer.x / w - 0.5) * -10 : 0
      const py = pointer.y > -999 ? (pointer.y / h - 0.5) * -6 : 0
      ctx.save()
      ctx.translate(px, py)
      // Handoff: the last stretch of each slot, where this scene draws itself off as the next one
      // draws on over it. q runs 0..1 through it (0 when there isn't one under way).
      const handoffAt = SCENE_SECONDS - HANDOFF_SECONDS
      const q = phase > handoffAt ? (phase - handoffAt) / HANDOFF_SECONDS : 0
      const s = drawScene(SCENES[idx], local, stage, pal)
      const incoming = q > 0 ? drawScene(SCENES[next], phase - handoffAt, stage, pal) : null
      ctx.restore()

      // Vignette: edges fall away to the ground colour, heaviest at the foot, so the frame reads
      // like a film still and the bottom edge feels like a threshold into the page below.
      const vg = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.32, w / 2, h * 0.42, Math.hypot(w, h) * 0.62)
      vg.addColorStop(0, col(pal.lo, 0))
      vg.addColorStop(1, col(pal.lo, 0.85))
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
      const foot = ctx.createLinearGradient(0, h * 0.7, 0, h)
      foot.addColorStop(0, col(pal.lo, 0))
      foot.addColorStop(1, col(pal.lo, 0.7))
      ctx.fillStyle = foot
      ctx.fillRect(0, h * 0.7, w, h * 0.3)

      // ---- HUD ----
      const shown = q > 0.5 ? SCENES[next] : SCENES[idx]
      const hs: SceneCtx = q > 0.5 && incoming ? incoming : s
      // The words hand over too: the old title lifts away as it fades, the new one rises into place.
      const fade = q > 0 ? easeInOutCubic(Math.abs(q - 0.5) * 2) : clamp01(local / 0.6)
      const lift = (1 - fade) * 8 * (q > 0 && q < 0.5 ? -1 : 1)

      const shownIdx = q > 0.5 ? next : idx
      ctx.fillStyle = col(WHITE, 0.7)
      label(ctx, `SELECTED WORK   ${String(shownIdx + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`, m + 8, m + 20, 10)
      // Narrow (phone) frames keep just the title, index and progress; the rest would collide.
      const compact = w < 640
      if (!compact) {
        ctx.textAlign = 'right'
        ctx.fillStyle = col(WHITE, 0.55 * fade)
        label(ctx, shown.tags, w - m - 8, m + 20 + lift, 10)
        ctx.textAlign = 'left'
      }

      // Title + meta, bottom left.
      const hb = h - bottomPad // the HUD's floor
      const ty = hb - m - 22 + lift
      ctx.fillStyle = col(WHITE, fade)
      label(ctx, shown.title.toUpperCase(), m + 8, ty - 16, Math.round(Math.min(40, Math.max(26, w * 0.028))), 900)
      ctx.fillStyle = col(WHITE, 0.6 * fade)
      label(ctx, shown.meta, m + 8, ty + 6, 11)

      // Readouts, bottom right. When a word changes (a status, a phase) the old one fades out and
      // the new one fades in; counters just tick.
      ctx.textAlign = 'right'
      if (!compact) {
        const span = READOUT_FADE / (LIFE_SECONDS - 2 * SHOWN_SECONDS) // in p
        const valuesAt = (p: number) => shown.readouts({ ...hs, p: Math.max(0, p) })
        const before = valuesAt(hs.p - span)
        shown.readouts(hs).forEach(([k, v], i) => {
          const y = hb - m - 76 + i * 20
          ctx.fillStyle = col(WHITE, 0.45 * fade)
          label(ctx, k, w - m - 128, y, 9)
          const was = before[i][1]
          let u = 1 // 0 at the change .. 1 once the new word is fully in
          if (was !== v && !/\d/.test(was + v)) {
            // Find when it changed.
            let lo = hs.p - span, hi = hs.p
            for (let n = 0; n < 8; n++) {
              const mid = (lo + hi) / 2
              if (valuesAt(mid)[i][1] === v) hi = mid
              else lo = mid
            }
            u = (hs.p - hi) / span
            ctx.fillStyle = col(WHITE, 0.95 * fade * clamp01(1 - u * 2))
            label(ctx, was, w - m - 8, y, 11)
          }
          ctx.fillStyle = col(WHITE, 0.95 * fade * clamp01(u * 2 - 1))
          label(ctx, v, w - m - 8, y, 11)
        })
      }
      ctx.textAlign = 'left'

      // Scroll cue, bottom centre: points at this project's case study when there is one.
      if (!compact) {
        const cueText = shown.slug ? 'VIEW CASE STUDY' : 'CASE STUDIES BELOW'
        const cx = w / 2, cy = hb - m - 34
        ctx.textAlign = 'center'
        ctx.fillStyle = col(WHITE, 0.85 * fade)
        label(ctx, cueText, cx, cy, 10, 600)
        ctx.textAlign = 'left'
        // A short line with a light travelling down it, then the chevron.
        const lineTop = cy + 8, lineLen = 16
        ctx.fillStyle = col(WHITE, 0.2)
        ctx.fillRect(cx - 0.5, lineTop, 1, lineLen)
        const u = (time * 0.8) % 1
        // Fades in at the top as well as out at the bottom, so the loop has no seam.
        ctx.fillStyle = col(WHITE, 0.95 * Math.sin(u * Math.PI))
        ctx.fillRect(cx - 0.5, lineTop + u * lineLen, 1, 5)
        ctx.strokeStyle = col(WHITE, 0.85)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cx - 4, lineTop + lineLen + 1)
        ctx.lineTo(cx, lineTop + lineLen + 5)
        ctx.lineTo(cx + 4, lineTop + lineLen + 1)
        ctx.stroke()
        ctx.lineWidth = 1
      }

      // Progress: one segment per project.
      const segW = 26, segY = hb - m - 2
      SCENES.forEach((_, i) => {
        const x = w - m - 8 - (SCENES.length - i) * (segW + 4) + 4
        ctx.fillStyle = col(WHITE, 0.2)
        ctx.fillRect(x, segY - 12, segW, 2)
        const fill = i < idx ? 1 : i === idx ? phase / SCENE_SECONDS : 0
        ctx.fillStyle = col(WHITE, 0.9)
        ctx.fillRect(x, segY - 12, segW * fill, 2)
      })
    },
  }
}

/** A scene time that shows a settled frame (for reduced motion). */
export const STILL_TIME = SCENE_SECONDS * 0.55
