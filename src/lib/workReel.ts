import type { Palette, RGB } from './timeOfDay'

/*
 * The home header's motion graphic: a looping reel of the work on kaelub.com, drawn as
 * technical line art on a 2D canvas. Each project is a scene that draws itself on, runs, and
 * hands over to the next with a scan wipe. Colours come from the time-of-day palette (lo =
 * ground, mid/hi = linework), so the reel drifts from dawn to night like the old header did.
 */

type Pointer = { x: number; y: number }
type Box = { x: number; y: number; w: number; h: number }

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
const WIPE_SECONDS = 0.9
const TAU = Math.PI * 2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

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
  return {
    slug: 'xbox',
    title: 'Xbox Arcade',
    meta: 'Product Design · 2026',
    tags: 'CLOUD GAMING / GROUP DECISIONS / DISCORD',
    readouts: ({ p }) => [
      ['PARTY', '4 / 4'],
      ['VOTES', String(Math.min(23, Math.floor(p * 30))).padStart(2, '0')],
      ['PICK', p > 0.74 ? games[1] : 'SPINNING'],
    ],
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      const cx = box.x + box.w * 0.6, cy = box.y + box.h * 0.5
      const R = Math.min(box.h * 0.4, box.w * 0.22) * (0.85 + 0.15 * reveal)
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
      // The wheel spins up and settles on a pick.
      const step = TAU / segs
      const spin = easeOutCubic(clamp01((p - 0.1) / 0.64))
      const rot = -Math.PI / 2 - step * 1.5 + spin * (TAU * 3 + step * 0) - TAU * 3
      const landed = p > 0.74
      for (let k = 0; k < segs; k++) {
        const a0 = rot + k * step
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, a0, a0 + step)
        ctx.closePath()
        if (landed && k === 1) {
          ctx.fillStyle = col(pal.mid, 0.35 + 0.15 * Math.sin(t * 6))
          ctx.fill()
        }
        ctx.strokeStyle = col(pal.hi, 0.7)
        ctx.stroke()
        const am = a0 + step / 2
        ctx.fillStyle = col(WHITE, 0.55)
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
      // Pointer.
      ctx.beginPath()
      ctx.moveTo(cx, cy - R + 6)
      ctx.lineTo(cx - 7, cy - R - 12)
      ctx.lineTo(cx + 7, cy - R - 12)
      ctx.closePath()
      ctx.fillStyle = col(WHITE, 0.95)
      ctx.fill()
      // ASCII Xbox sphere, top right: shaded with characters, the X cut across its face, lit by a
      // light that circles it.
      const cols = 26, rows = 13, cw = 6, chH = 10
      const ox = box.x + box.w - cols * cw, oy = box.y
      ctx.font = '9px ui-monospace, Menlo, monospace'
      const ramp = ' .:-=+*#%@'
      const la = t * 0.9
      const L = [Math.cos(la) * 0.6, -0.45, 0.66]
      // Narrow (phone) frames have no room beside the wheel for it.
      const orb = box.w >= 600
      for (let j = 0; orb && j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const nx = ((i + 0.5) / cols) * 2 - 1, ny = ((j + 0.5) / rows) * 2 - 1
          const rr = nx * nx + ny * ny
          if (rr > 1 || (j * cols + i) / (rows * cols) > reveal * 1.2) continue
          const nz = Math.sqrt(1 - rr)
          const lum = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * 0.85 + 0.12
          // The X: two curved diagonal bands across the face, wider toward the rim.
          const bend = 0.16 + rr * 0.08
          const cut = Math.abs(nx - ny * 0.92) < bend || Math.abs(nx + ny * 0.92) < bend
          const ch = cut ? ' ' : ramp[Math.min(ramp.length - 1, Math.floor(lum * ramp.length))]
          if (ch === ' ') continue
          ctx.fillStyle = col(lum > 0.6 ? WHITE : pal.hi, 0.35 + lum * 0.6)
          ctx.fillText(ch, ox + i * cw, oy + j * chH + 9)
        }
      }
      if (orb) {
        ctx.fillStyle = col(WHITE, 0.5)
        label(ctx, 'XBOX CLOUD GAMING', ox, oy + rows * chH + 16, 8)
      }

      // Controller face buttons, bottom right: A pulses to start the spin, then to join.
      const bx = box.x + box.w - 34, by = box.y + box.h - 44, gap = 22
      const buttons: [string, number, number][] = [['Y', 0, -1], ['X', -1, 0], ['B', 1, 0], ['A', 0, 1]]
      const aPulse = Math.max(pulse(p, 0.1) , p > 0.78 ? 0.5 + 0.5 * Math.sin(t * 5) : 0)
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
      ctx.textAlign = 'right'
      ctx.fillStyle = col(WHITE, 0.75)
      label(ctx, p < 0.12 ? 'PRESS A TO SPIN' : landed ? 'PRESS A TO JOIN' : 'SPINNING…', bx - gap - 18, by + 4, 9, 600)
      ctx.textAlign = 'left'

      // Ranking: the party's votes, live.
      const x0 = box.x, y0 = box.y + Math.max(box.h * 0.24, 120), bw = box.w * 0.3
      ctx.fillStyle = col(WHITE, 0.6)
      label(ctx, 'RANKING', x0, y0 - 18, 9)
      games.forEach((g, k) => {
        const y = y0 + k * 36
        const grow = easeOutExpo(clamp01(reveal * 1.4 - k * 0.1))
        const v = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.9 + k * 1.7)) * (k === 1 && landed ? 0 : 1) + (k === 1 && landed ? 0.95 : 0)
        ctx.fillStyle = col(WHITE, 0.75)
        label(ctx, `${String(k + 1).padStart(2, '0')}  ${g}`, x0, y, 9)
        ctx.fillStyle = col(pal.hi, 0.12)
        ctx.fillRect(x0, y + 7, bw * grow, 3)
        ctx.fillStyle = col(k === 1 ? pal.hi : pal.mid, 0.9)
        ctx.fillRect(x0, y + 7, bw * v * grow, 3)
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
        ctx.fillStyle = col(pal.mid, 0.18 + (landed ? 0.2 : vote * 0.2))
        ctx.fill()
        ctx.strokeStyle = col(pal.hi, 0.8)
        ctx.stroke()
        ctx.fillStyle = col(WHITE, 0.9)
        ctx.textAlign = 'center'
        label(ctx, who, x, y + 3.5, 9, 700)
        ctx.textAlign = 'left'
        ctx.beginPath()
        ctx.arc(x + 9, y + 9, 3, 0, TAU)
        ctx.fillStyle = col(landed || vote > 0.5 ? WHITE : pal.mid, 0.95)
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
  const cursor = (ctx: CanvasRenderingContext2D, x: number, y: number, col: SceneCtx['col'], press: number) => {
    ctx.save()
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
      const narrow = box.w < 600
      // ---- Web app window: Track Logs ----
      const wx = box.x, wy = box.y + 6, ww = narrow ? 0 : box.w * 0.5, wh = box.h * 0.84
      const tRowH = Math.min(42, (wh - 96) / logs.length)
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
          const active = i === ROW && p > MENU
          if (active) {
            ctx.fillStyle = col(pal.mid, 0.16)
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
          if (menu > 0.6) {
            ctx.fillStyle = col(pal.mid, 0.3)
            ctx.fillRect(mx + 4, my + 6, 124, 20)
            ctx.fillStyle = col(WHITE, 0.95)
            label(ctx, 'Link to Logbook', mx + 12, my + 20, 10, 600)
            ctx.fillStyle = col(WHITE, 0.3)
            bar(ctx, mx + 12, my + 44, 70)
            bar(ctx, mx + 12, my + 64, 90)
          }
        }
      }

      // ---- "Add to Logbook" picker, laid out like the final design ----
      const m = at(p, MODAL, MODAL + 0.08)
      const mw = narrow ? box.w : box.w * 0.4
      const mx = (narrow ? box.x : box.x + box.w * 0.58) + (1 - easeOutCubic(m)) * 40
      const my = box.y, mh = box.h * 0.94
      const rowH = Math.min(46, mh / 11)
      let linkedRow: Pt | null = null
      let toggleAt: Pt = [mx + 30, my + 200]
      let createAt: Pt = [mx + mw / 2, my + mh - 40]
      if (m > 0) {
        ctx.globalAlpha = m
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

        const toggled = p > TOGGLE
        const madeNew = at(p, CREATE, CREATE + 0.06)
        let y = my + 78
        const strip = (text: string) => {
          ctx.fillStyle = col(pal.hi, 0.1)
          ctx.fillRect(mx + 1, y, mw - 2, 22)
          ctx.fillStyle = col(WHITE, 0.6)
          label(ctx, text, mx + 18, y + 15, 9, 600)
          y += 22
        }
        const row = (e: Entry, linked: boolean, highlight: number, grow = 1) => {
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
          ctx.fillStyle = linked ? col(pal.mid, 0.35) : col(WHITE, 0.16)
          ctx.fill()
          ctx.strokeStyle = col(linked ? pal.hi : WHITE, 0.9)
          ctx.lineWidth = 1.6
          ctx.beginPath()
          if (linked) {
            // Unlink glyph: two broken chain halves.
            ctx.arc(cx - 3, cy + 3, 3, Math.PI * 0.5, Math.PI * 1.5)
            ctx.moveTo(cx + 3, cy - 6)
            ctx.arc(cx + 3, cy - 3, 3, -Math.PI * 0.5, Math.PI * 0.5)
          } else {
            ctx.moveTo(cx - 5, cy)
            ctx.lineTo(cx + 5, cy)
            ctx.moveTo(cx, cy - 5)
            ctx.lineTo(cx, cy + 5)
          }
          ctx.stroke()
          ctx.lineWidth = 1
          // What: route, tail, and the Linked / Just created tag.
          const tx = mx + 50
          ctx.fillStyle = col(WHITE, 0.95)
          label(ctx, e.route, tx, cy - 3, 11, 600)
          ctx.fillStyle = col(WHITE, 0.5)
          label(ctx, e.tail, tx, cy + 12, 9)
          if (linked) {
            const tag = e === created ? 'Just created' : 'Linked'
            ctx.font = '600 8px "Open Sauce One", system-ui, sans-serif'
            const tw = ctx.measureText(tag).width + 12
            const gx = tx + ctx.measureText(e.tail).width + 42
            ctx.strokeStyle = col(pal.hi, 0.9)
            rrect(ctx, gx, cy + 3, tw, 13, 6.5)
            ctx.stroke()
            ctx.fillStyle = col(pal.hi, 1)
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
        if (madeNew > 0) row(created, true, 0, easeOutCubic(madeNew))
        recent.forEach((e) => row(e, !!e.linked, 0))
        strip('Recommended Entries')
        recommended.forEach((e, k) => {
          const at0 = row(e, k === 0 && toggled, k === 0 ? at(p, TOGGLE - 0.06, TOGGLE) * (1 - at(p, CREATE - 0.04, CREATE)) : 0)
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
        ctx.globalAlpha = 1
      }

      // ---- The link: telemetry travelling from the track log into the entry ----
      if (!narrow && linkedRow && p > FLOW) {
        const f = at(p, FLOW, FLOW + 0.14)
        const from: Pt = [wx + ww, rowY(ROW) + tRowH / 2]
        const to: Pt = linkedRow
        const path = spline([from, [from[0] + (to[0] - from[0]) * 0.5, from[1]], [from[0] + (to[0] - from[0]) * 0.5, to[1]], to], 20)
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = col(pal.hi, 0.8)
        strokeTo(ctx, path, f)
        ctx.setLineDash([])
        if (f >= 1) {
          for (let k = 0; k < 4; k++) {
            const u = (t * 0.6 + k / 4) % 1
            const pt = path[Math.floor(u * (path.length - 1))]
            ctx.fillStyle = col(WHITE, 0.9)
            ctx.fillRect(pt[0] - 1.5, pt[1] - 1.5, 3, 3)
          }
        }
      }

      // ---- Cursor: kebab -> "Link to Logbook" -> recommended entry's toggle ----
      if (!narrow && p > 0.06 && p < CREATE + 0.1) {
        const kebab: Pt = [wx + ww - 21, rowY(ROW) + tRowH / 2]
        const item: Pt = [wx + ww - 110, rowY(ROW) + tRowH + 10]
        const start: Pt = [wx + ww * 0.6, wy + wh * 0.8]
        let c: Pt
        if (p < MENU) c = lerpPt(start, kebab, easeInOutCubic(at(p, 0.06, MENU)))
        else if (p < CLICK) c = lerpPt(kebab, item, easeInOutCubic(at(p, MENU + 0.04, CLICK - 0.02)))
        else if (p < TOGGLE + 0.02) c = lerpPt(item, toggleAt, easeInOutCubic(at(p, CLICK + 0.08, TOGGLE - 0.02)))
        else c = lerpPt(toggleAt, createAt, easeInOutCubic(at(p, FLOW + 0.04, CREATE - 0.02)))
        const press = Math.max(pulse(p, MENU), pulse(p, CLICK), pulse(p, TOGGLE), pulse(p, CREATE))
        cursor(ctx, c[0], c[1], col, press)
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
      const s = Math.min((box.w * 0.6) / span, box.h / (3.6 + span * 0.5 + 0.6))
      const ox = box.x + box.w * 0.66 - ((cols - rows) / 2) * s
      const oy = box.y + s * 3.6
      const k = s * 0.62 // footprint half-width; the rest of the lot is street
      const year = yearAt(p)
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
          const owner = owners[(Math.floor(b * 7) + Math.floor((year - 1990 + i * 3 + j * 2) / 8)) % 3]
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
      // Legend.
      const lx = box.x, ly = box.y + box.h * 0.3
      ctx.fillStyle = col(WHITE, 0.6)
      label(ctx, 'OWNERSHIP BY PARCEL', lx, ly - 18, 9)
      ;['DEVELOPER', 'TRUST', 'PUBLIC'].forEach((name, n) => {
        ctx.fillStyle = col(owners[n], 0.9)
        ctx.fillRect(lx, ly + n * 22, 10, 10)
        ctx.fillStyle = col(WHITE, 0.75)
        label(ctx, name, lx + 18, ly + n * 22 + 9, 9)
      })
      // Year scrubber.
      const sx = box.x, sy = box.y + box.h - 6, sw = box.w * 0.34
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
  // Traced from the Project Open render: a bandless ear hook (a ball at each end) carrying a
  // round open-back cup, shown as an exploded view. The story, over the scene:
  //   draw on assembled -> explode along the axis with callouts -> reassemble -> the ear it
  //   leaves open, with ambient sound passing in while audio plays from the cup.
  const EXPLODE = [0.08, 0.3] as const
  const COLLAPSE = [0.5, 0.64] as const
  const phaseOf = (p: number) =>
    p < EXPLODE[1] ? 'EXPLODED VIEW' : p < COLLAPSE[0] ? 'EXPLODED VIEW' : p < COLLAPSE[1] ? 'ASSEMBLING' : 'OPEN EAR'
  type Part = { off: number; label: string; draw: (ctx: CanvasRenderingContext2D, x: number, y: number, R: number) => void }
  const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU)
    ctx.stroke()
  }
  const parts: Part[] = [
    {
      off: -0.4,
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
    {
      off: -0.29,
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
      off: -0.19,
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
      off: -0.11,
      label: 'DAMPING FOAM',
      draw: (ctx, x, y, R) => {
        for (let k = 0; k < 3; k++) ctx.strokeRect(x - R * 0.2 + k * R * 0.17, y - R * 0.55, R * 0.1, R * 1.1)
      },
    },
    {
      off: 0.14,
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
      off: 0.24,
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
      off: 0.36,
      label: 'COIL',
      draw: (ctx, x, y, R) => {
        for (let k = 1; k <= 4; k++) ring(ctx, x, y, R * 0.07 * k, R * 0.15 * k)
      },
    },
  ]

  // The assembled piece: hook + cup, around a centre point.
  const hook = (ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, reveal: number, col: SceneCtx['col'], pal: Palette) => {
    const top: Pt = [cx - R * 0.95, cy - R * 1.45]
    const bottom: Pt = [cx - R * 0.55, cy + R * 1.55]
    const arm = spline([top, [cx - R * 0.2, cy - R * 1.85], [cx + R * 0.7, cy - R * 1.3], [cx + R * 0.55, cy - R * 0.1], [cx + R * 0.05, cy + R * 0.9], bottom], 24)
    // Tube: a wide light stroke with a dark core reads as an outlined arm.
    ctx.lineCap = 'round'
    ctx.lineWidth = R * 0.2
    ctx.strokeStyle = col(pal.hi, 0.9)
    strokeTo(ctx, arm, reveal)
    ctx.lineWidth = R * 0.2 - 3
    ctx.strokeStyle = col(pal.lo, 1)
    strokeTo(ctx, arm, reveal)
    ctx.lineCap = 'butt'
    ctx.lineWidth = 1
    ctx.strokeStyle = col(pal.hi, 0.9)
    ;[top, bottom].forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, R * 0.3 * reveal, 0, TAU)
      ctx.fillStyle = col(pal.lo, 1)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x - R * 0.08, y - R * 0.08, R * 0.1 * reveal, 0, TAU)
      ctx.stroke()
    })
    // Open-back cup: the round face, its rings, and the vent slots that keep it open.
    const ux = cx + R * 0.35
    ctx.beginPath()
    ctx.ellipse(ux, cy, R * 0.62 * reveal, R * 0.8 * reveal, 0, 0, TAU)
    ctx.fillStyle = col(pal.lo, 1)
    ctx.fill()
    ctx.strokeStyle = col(WHITE, 0.9)
    ctx.stroke()
    ctx.strokeStyle = col(pal.hi, 0.7)
    ring(ctx, ux + R * 0.05, cy, R * 0.44 * reveal, R * 0.58 * reveal)
    ring(ctx, ux + R * 0.08, cy, R * 0.22 * reveal, R * 0.3 * reveal)
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU
      ctx.moveTo(ux + R * 0.05 + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.4)
      ctx.lineTo(ux + R * 0.05 + Math.cos(a) * R * 0.4, cy + Math.sin(a) * R * 0.53)
    }
    ctx.stroke()
    return ux
  }

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
      const R = Math.min(box.h * 0.14, box.w * 0.065)
      const cx = box.x + box.w * 0.5, cy = box.y + box.h * 0.45
      const out = easeInOutCubic(clamp01((p - EXPLODE[0]) / (EXPLODE[1] - EXPLODE[0])))
      const back = easeInOutCubic(clamp01((p - COLLAPSE[0]) / (COLLAPSE[1] - COLLAPSE[0])))
      const e = out * (1 - back) // 0 assembled .. 1 exploded
      const float = Math.sin(t * 1.4) * 3 * e

      // Exploded axis.
      if (e > 0.01) {
        ctx.setLineDash([2, 5])
        ctx.strokeStyle = col(pal.hi, 0.35 * e)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx - box.w * 0.46 * e, cy)
        ctx.lineTo(cx + box.w * 0.42 * e, cy)
        ctx.stroke()
        ctx.setLineDash([])
      }
      // Parts ride out along the axis, then home again into the cup.
      parts.forEach((part, k) => {
        const x = cx + R * 0.4 + part.off * box.w * e
        const y = cy + (k % 2 ? float : -float)
        // Hidden until clear of the cup, so the assembled piece reads cleanly.
        const a = clamp01((e - 0.08) * 2.2)
        if (a <= 0) return
        ctx.lineWidth = 1
        ctx.strokeStyle = col(k % 2 ? pal.hi : WHITE, 0.85 * a)
        ctx.fillStyle = col(pal.hi, 0.85 * a)
        part.draw(ctx, x, y, R)
        // Callout.
        const c = clamp01((e - 0.7) / 0.3)
        if (c > 0) {
          const ly = cy - R * 1.55 - (k % 2) * 16
          ctx.strokeStyle = col(WHITE, 0.4 * c)
          ctx.beginPath()
          ctx.moveTo(x, y - R * 1.1)
          ctx.lineTo(x, ly + 4)
          ctx.stroke()
          ctx.fillStyle = col(WHITE, 0.8 * c)
          ctx.textAlign = 'center'
          label(ctx, part.label, x, ly, 9)
          ctx.textAlign = 'left'
        }
      })

      // The assembled piece.
      hook(ctx, cx, cy, R, reveal, col, pal)

      // The ear it leaves open. The hook wraps behind the ear, so the ear is drawn on top of it,
      // beside the cup rather than under it; ambient sound (from the left) and audio (from the
      // cup) both reach the uncovered ear.
      const open = clamp01((p - COLLAPSE[1]) / 0.1)
      if (open > 0) {
        const S = R * 1.25
        const ex = cx - R * 0.55, ey = cy + R * 0.05
        const outer = spline(([
          [0.25, 1.0], [-0.3, 0.8], [-0.62, 0.1], [-0.5, -0.75], [0.0, -1.12], [0.5, -0.8], [0.55, -0.2], [0.28, 0.35], [0.2, 0.62],
        ] as Pt[]).map(([u, v]) => [ex + u * S, ey + v * S] as Pt), 16)
        const inner = spline(([[0.05, -0.72], [0.3, -0.45], [0.18, -0.05], [-0.1, 0.1]] as Pt[]).map(([u, v]) => [ex + u * S, ey + v * S] as Pt), 16)
        ctx.lineWidth = 1.6
        ctx.strokeStyle = col(WHITE, 0.95)
        strokeTo(ctx, outer, open)
        ctx.lineWidth = 1
        ctx.strokeStyle = col(WHITE, 0.6)
        strokeTo(ctx, inner, open)
        // Ear canal.
        const canal: Pt = [ex + 0.02 * S, ey + 0.25 * S]
        ctx.beginPath()
        ctx.arc(canal[0], canal[1], 3, 0, TAU)
        ctx.fillStyle = col(WHITE, open)
        ctx.fill()
        // Ambient: arcs travelling in from the far left.
        for (let k = 0; k < 4; k++) {
          const f = (t * 0.7 + k / 4) % 1
          const r = R * (0.5 + (1 - f) * 2.6)
          ctx.beginPath()
          ctx.arc(canal[0], canal[1], r, Math.PI - 0.4, Math.PI + 0.4)
          ctx.strokeStyle = col(pal.hi, open * 0.75 * f)
          ctx.stroke()
        }
        // Audio: arcs from the cup, travelling left into the ear.
        const ux = cx + R * 0.35
        for (let k = 0; k < 3; k++) {
          const f = (t * 0.9 + k / 3) % 1
          ctx.beginPath()
          ctx.arc(ux, cy, R * (0.85 + f * 0.9), Math.PI - 0.45, Math.PI + 0.45)
          ctx.strokeStyle = col(pal.mid, open * 0.9 * (1 - f))
          ctx.stroke()
        }
        ctx.textAlign = 'center'
        ctx.fillStyle = col(WHITE, 0.6 * open)
        label(ctx, 'AMBIENT', canal[0] - R * 3.2, canal[1] + 4, 9)
        label(ctx, 'AUDIO', ux + R * 1.1, cy + 4, 9)
        ctx.fillStyle = col(WHITE, 0.9 * open)
        label(ctx, 'EAR STAYS OPEN', ex + R * 0.3, cy + R * 2.25, 10, 600)
        ctx.textAlign = 'left'
      }

      // Oscilloscope along the foot.
      const wy = box.y + box.h - 18, ww = box.w * 0.46
      ctx.beginPath()
      for (let i = 0; i <= 200 * reveal; i++) {
        const u = i / 200
        const Y = wy + Math.sin(u * 40 + t * 8) * 6 * Math.sin(u * Math.PI) + Math.sin(u * 13 - t * 3) * 3
        i ? ctx.lineTo(box.x + u * ww, Y) : ctx.moveTo(box.x, Y)
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

  const drawScene = (scene: Scene, local: number, box: Box, pal: Palette, clip?: [number, number]) => {
    const s: SceneCtx = {
      ctx,
      box,
      t: local,
      // A scene's clock starts at its incoming wipe, so it lives SCENE + WIPE seconds.
      p: clamp01(local / (SCENE_SECONDS + WIPE_SECONDS)),
      reveal: easeOutCubic(clamp01(local / 1.4)),
      col,
      pal,
    }
    ctx.save()
    if (clip) {
      ctx.beginPath()
      ctx.rect(clip[0], 0, clip[1] - clip[0], h)
      ctx.clip()
    }
    scene.draw(s)
    ctx.restore()
    return s
  }

  return {
    /** The case study slug for whatever is on screen at this time (if it has one). */
    currentSlug(time: number) {
      const cycle = SCENES.length * SCENE_SECONDS
      const tt = ((time % cycle) + cycle) % cycle
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
      // phase: where we are in this scene's slot. local: the scene's own clock, which began at
      // the wipe that brought it in (so it carries straight on after the scan finishes). The
      // very first scene on load had no wipe, so its clock starts at zero.
      const phase = tt - idx * SCENE_SECONDS
      const local = phase + (time < SCENE_SECONDS ? 0 : WIPE_SECONDS)
      const next = (idx + 1) % SCENES.length
      const box: Box = { x: m + 8, y: m + 44, w: w - 2 * m - 16, h: h - bottomPad - 2 * m - 130 }

      // The art drifts slightly against the pointer.
      const px = pointer.x > -999 ? (pointer.x / w - 0.5) * -10 : 0
      const py = pointer.y > -999 ? (pointer.y / h - 0.5) * -6 : 0
      ctx.save()
      ctx.translate(px, py)
      const wipeAt = SCENE_SECONDS - WIPE_SECONDS
      let s: SceneCtx
      let incoming: SceneCtx | null = null
      let q = 0
      if (phase > wipeAt) {
        // Scan wipe: the next scene is drawn in behind a line sweeping left to right.
        q = easeInOutCubic((phase - wipeAt) / WIPE_SECONDS)
        const xs = q * w
        s = drawScene(SCENES[idx], local, box, pal, [xs, w])
        incoming = drawScene(SCENES[next], phase - wipeAt, box, pal, [0, xs])
      } else {
        s = drawScene(SCENES[idx], local, box, pal)
      }
      ctx.restore()
      if (q > 0) {
        const xs = q * w
        const band = ctx.createLinearGradient(xs - 60, 0, xs, 0)
        band.addColorStop(0, col(pal.hi, 0))
        band.addColorStop(1, col(pal.hi, 0.22))
        ctx.fillStyle = band
        ctx.fillRect(xs - 60, 0, 60, h)
        ctx.fillStyle = col(WHITE, 0.95)
        ctx.fillRect(xs - 1, 0, 1.5, h)
      }

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
      const fade = q > 0 ? Math.abs(q - 0.5) * 2 : clamp01(local / 0.6)

      const shownIdx = q > 0.5 ? next : idx
      ctx.fillStyle = col(WHITE, 0.7)
      label(ctx, `SELECTED WORK   ${String(shownIdx + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`, m + 8, m + 20, 10)
      // Narrow (phone) frames keep just the title, index and progress; the rest would collide.
      const compact = w < 640
      if (!compact) {
        ctx.textAlign = 'right'
        ctx.fillStyle = col(WHITE, 0.55 * fade)
        label(ctx, shown.tags, w - m - 8, m + 20, 10)
        ctx.textAlign = 'left'
      }

      // Title + meta, bottom left.
      const hb = h - bottomPad // the HUD's floor
      const ty = hb - m - 22
      ctx.fillStyle = col(WHITE, fade)
      label(ctx, shown.title.toUpperCase(), m + 8, ty - 16, Math.round(Math.min(40, Math.max(26, w * 0.028))), 900)
      ctx.fillStyle = col(WHITE, 0.6 * fade)
      label(ctx, shown.meta, m + 8, ty + 6, 11)

      // Readouts, bottom right.
      ctx.textAlign = 'right'
      if (!compact) shown.readouts(hs).forEach(([k, v], i) => {
        const y = hb - m - 76 + i * 20
        ctx.fillStyle = col(WHITE, 0.45 * fade)
        label(ctx, k, w - m - 128, y, 9)
        ctx.fillStyle = col(WHITE, 0.95 * fade)
        label(ctx, v, w - m - 8, y, 11)
      })
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
        ctx.fillStyle = col(WHITE, 0.95 * (1 - u))
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
