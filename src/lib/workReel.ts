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

/**
 * Where the DOM overlays sit: the call to action under the description (which it doesn't fade or
 * lift with), and the progress bar's hit area, whose segments are 26px wide with 4px gaps.
 */
export type Hud = { x: number; y: number; bar: { x: number; y: number }; idx: number }

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
  /** One sentence on the project, shown bottom left while its scene plays. */
  description: string
  draw: (s: SceneCtx) => void
}

const WHITE: RGB = [1, 1, 1]
const SCENE_SECONDS = 8
/**
 * Scenes hand over across this overlap rather than cutting or wiping: the outgoing one draws
 * itself off (its draw-on in reverse) while the incoming one draws on in the same space.
 */
const HANDOFF_SECONDS = 1.5
/** A scene's whole life: the handoff that brings it in, then its slot. */
const LIFE_SECONDS = SCENE_SECONDS + HANDOFF_SECONDS
/** How far into a handoff the arriving scene shows (and how far before its end the leaving one goes). */
const SHOWN_SECONDS = 0.5
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

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 10, weight = 500) {
  ctx.font = `${weight} ${size}px "Open Sauce One", system-ui, sans-serif`
  ctx.fillText(text, x, y)
}

/** Greedy word wrap at the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
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
    description:
      'A cloud-gaming product that helps friend groups discover, decide on, and instantly play games together without leaving Discord.',
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
  // The work is under NDA, so no product UI: a flight instead. A small plane cruises at a steady
  // height, following its route through the mountains, while the land streams past beneath it
  // and airports slide by along the way. Same isometric camera as Project Open.
  //
  // The land is a long strip: X runs along the flight (0..LENGTH), Z across it (-WIDE..WIDE),
  // height is y. The plane stays over X = scroll, which advances at SPEED; the frame shows WINDOW
  // either side of it.
  const LENGTH = 17, WIDE = 2.8, SPEED = 1.15, START = 1.6, WINDOW = 3.2
  /** The route across the strip: a gentle weave the plane follows. */
  const routeZ = (x: number) => 0.55 * Math.sin(x * 0.55 + 0.4) + 0.22 * Math.sin(x * 1.25 + 2)
  const routeSlope = (x: number) => 0.3025 * Math.cos(x * 0.55 + 0.4) + 0.275 * Math.cos(x * 1.25 + 2)
  const AIRPORTS = [
    // Passing under the plane about 1.5s, 4.5s and 7s into the scene.
    { code: 'KRIL', x: 3.3 },
    { code: 'KEGE', x: 6.8 },
    { code: 'KASE', x: 9.7 },
  ]

  // Terrain: peaks scattered along the strip with some ripple, and a valley carved along the
  // route so the airports sit on low ground.
  const rnd = seeded(7)
  const peaks = Array.from({ length: 60 }, () => ({
    x: rnd() * LENGTH, z: (rnd() * 2 - 1) * WIDE, h: 0.55 + rnd() * 1.05, r: 0.45 + rnd() * 0.5,
  }))
  const height = (x: number, z: number) => {
    let h = 0
    for (const pk of peaks) {
      const d2 = (x - pk.x) ** 2 + (z - pk.z) ** 2
      if (d2 < 9 * pk.r * pk.r) h = Math.max(h, pk.h * Math.exp(-d2 / (pk.r * pk.r)))
    }
    h += 0.06 * Math.sin(x * 2.3 + 1.1) * Math.cos(z * 1.9 - 0.4) + 0.04 * Math.sin(x * 5.1 - z * 4.3)
    const valley = Math.exp(-((z - routeZ(x)) ** 2) / (0.5 * 0.5))
    return Math.max(0, h * (1 - 0.8 * valley))
  }

  // Contours: marching squares over the strip at every LEVEL_STEP, done once. Segments are
  // binned by level, by how far across the strip they are, and by CHUNK along it, so a frame
  // strokes only the chunks in view, each faded by its distance from the plane.
  const STEP = 0.09, LEVEL_STEP = 0.1, LEVELS = 16, BANDS = 4, CHUNK = 0.8
  const NX = Math.round(LENGTH / STEP), NZ = Math.round((2 * WIDE) / STEP)
  const hs: number[] = []
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) hs.push(height(i * STEP, -WIDE + j * STEP))
  const CHUNKS = Math.ceil(LENGTH / CHUNK)
  const bins: number[][][][] = Array.from({ length: LEVELS }, () =>
    Array.from({ length: BANDS }, () => Array.from({ length: CHUNKS }, () => [])),
  )
  for (let li = 0; li < LEVELS; li++) {
    const L = (li + 0.5) * LEVEL_STEP
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        const c = [hs[j * (NX + 1) + i], hs[j * (NX + 1) + i + 1], hs[(j + 1) * (NX + 1) + i + 1], hs[(j + 1) * (NX + 1) + i]]
        const pos: Pt[] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]
        const hits: Pt[] = []
        for (let e = 0; e < 4; e++) {
          const a = c[e], b = c[(e + 1) % 4]
          if (a < L !== b < L) {
            const u = (L - a) / (b - a), pa = pos[e], pb = pos[(e + 1) % 4]
            hits.push([(pa[0] + (pb[0] - pa[0]) * u) * STEP, -WIDE + (pa[1] + (pb[1] - pa[1]) * u) * STEP])
          }
        }
        for (let k = 0; k + 1 < hits.length; k += 2) {
          const [x0, z0] = hits[k], [x1, z1] = hits[k + 1]
          const band = Math.min(BANDS - 1, Math.floor(clamp01((Math.abs((z0 + z1) / 2) / WIDE - 0.3) / 0.7) * BANDS))
          const chunk = Math.min(CHUNKS - 1, Math.floor((x0 + x1) / 2 / CHUNK))
          bins[li][band][chunk].push(x0, z0, x1, z1)
        }
      }
    }
  }

  // Cruise clear of everything on the route.
  let highest = 0
  for (let x = 0; x <= LENGTH; x += 0.05) highest = Math.max(highest, height(x, routeZ(x)))
  const CRUISE = highest + 0.45

  // A small wireframe plane, in its own frame: forward, up, right.
  const PLANE: V3[][] = [
    [[0.24, 0, 0], [0.16, 0.03, -0.025], [-0.2, 0.015, -0.01], [-0.24, 0.03, 0], [-0.2, 0.015, 0.01], [0.16, 0.03, 0.025], [0.24, 0, 0]],
    [[0.24, 0, 0], [0.14, -0.02, 0], [-0.22, 0.01, 0]],
    [[0.1, 0.02, -0.3], [0.04, 0.02, -0.3], [0.0, 0.02, 0], [0.04, 0.02, 0.3], [0.1, 0.02, 0.3], [0.12, 0.02, 0], [0.1, 0.02, -0.3]],
    [[-0.15, 0.02, -0.1], [-0.2, 0.02, -0.1], [-0.22, 0.02, 0], [-0.2, 0.02, 0.1], [-0.15, 0.02, 0.1], [-0.14, 0.02, 0], [-0.15, 0.02, -0.1]],
    [[-0.15, 0.02, 0], [-0.22, 0.11, 0], [-0.25, 0.11, 0], [-0.24, 0.03, 0]],
  ]

  return {
    description: 'Under NDA: a system that links flight telemetry from ForeFlight’s Track Logs to pilots’ digital logbooks.',
    draw: ({ ctx, box, t, reveal, col, pal }) => {
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2
      const ppu = Math.min(box.h * 0.2, box.w / 2 / 3.2)
      const scroll = START + SPEED * t
      const yaw = ((28 + 6 * Math.sin(t * 0.25)) * Math.PI) / 180, pitch = (30 * Math.PI) / 180
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      // Orthographic, following the plane: the world slides by as scroll advances.
      const project = (x: number, y: number, z: number): Pt => {
        const X = x - scroll
        const x1 = X * cyw + z * syw, z1 = z * cyw - X * syw
        return [cx + x1 * ppu, cy - ((y - 0.95) * cp - z1 * sp) * ppu]
      }
      const path = (pts: V3[]) => {
        ctx.beginPath()
        pts.forEach(([x, y, z], i) => {
          const [X, Y] = project(x, y, z)
          i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
        })
      }
      /** Fades out towards the ends of the window, along the flight. */
      const along = (x: number) => Math.pow(1 - clamp01((Math.abs(x - scroll) - 0.3 * WINDOW) / (0.7 * WINDOW)), 1.6)
      ctx.lineWidth = 1

      // The land, drawing on from the valleys up; higher contours read brighter.
      const c0 = Math.max(0, Math.floor((scroll - WINDOW) / CHUNK)), c1 = Math.min(CHUNKS - 1, Math.floor((scroll + WINDOW) / CHUNK))
      for (let li = 0; li < LEVELS; li++) {
        const on = clamp01(reveal * (LEVELS + 3) - li)
        if (on <= 0) continue
        const L = (li + 0.5) * LEVEL_STEP
        for (let band = 0; band < BANDS; band++) {
          const across = Math.pow(1 - band / BANDS, 1.6)
          for (let ci = c0; ci <= c1; ci++) {
            const segs = bins[li][band][ci]
            if (!segs.length) continue
            const a = (0.22 + 0.45 * (li / LEVELS)) * across * along((ci + 0.5) * CHUNK) * on
            if (a <= 0.005) continue
            ctx.beginPath()
            for (let k = 0; k < segs.length; k += 4) {
              const [x0, y0] = project(segs[k], L, segs[k + 1]), [x1, y1] = project(segs[k + 2], L, segs[k + 3])
              ctx.moveTo(x0, y0)
              ctx.lineTo(x1, y1)
            }
            ctx.strokeStyle = col(mix(pal.hi, WHITE, (li / LEVELS) * 0.35), a)
            ctx.stroke()
          }
        }
      }

      // The route on the ground, dotted, as it would be on a chart.
      const ground: V3[] = []
      for (let x = scroll - WINDOW; x <= scroll + WINDOW; x += 0.08) ground.push([x, height(x, routeZ(x)) + 0.01, routeZ(x)])
      ctx.setLineDash([1, 4])
      path(ground)
      ctx.strokeStyle = col(pal.hi, 0.35 * reveal)
      ctx.stroke()
      ctx.setLineDash([])

      // Airports sliding by: a runway along the route, a ring, and the code on a post.
      ctx.textAlign = 'center'
      for (const { code, x } of AIRPORTS) {
        const a = along(x) * clamp01(reveal * 2 - 0.6)
        if (a <= 0.01) continue
        const z = routeZ(x), y = height(x, z) + 0.005
        const dl = Math.hypot(1, routeSlope(x))
        const fx = 1 / dl, fz = routeSlope(x) / dl
        const corner = (s: number, w: number): V3 => [x + fx * 0.18 * s - fz * 0.025 * w, y, z + fz * 0.18 * s + fx * 0.025 * w]
        path([corner(-1, 1), corner(1, 1), corner(1, -1), corner(-1, -1), corner(-1, 1)])
        ctx.strokeStyle = col(WHITE, 0.8 * a)
        ctx.stroke()
        path(Array.from({ length: 33 }, (_, n) => [x + Math.cos((n / 32) * TAU) * 0.3, y, z + Math.sin((n / 32) * TAU) * 0.3] as V3))
        ctx.strokeStyle = col(pal.hi, 0.35 * a)
        ctx.stroke()
        path([[x, y, z], [x, y + 0.34, z]])
        ctx.strokeStyle = col(WHITE, 0.3 * a)
        ctx.stroke()
        const [lx, ly] = project(x, y + 0.42, z)
        ctx.fillStyle = col(WHITE, 0.9 * a)
        label(ctx, code, lx, ly, 10, 600)
      }
      ctx.textAlign = 'left'

      // The plane, steady at cruise with a slight float, over the route.
      const bob = Math.sin(t * 1.6) * 0.03
      const planeAt: V3 = [scroll, CRUISE + bob, routeZ(scroll)]
      const on = clamp01(reveal * 1.6 - 0.5)

      // Its track: flown behind it, solid and fading; the route ahead, dashed.
      const behind: V3[] = [], ahead: V3[] = []
      for (let x = scroll - WINDOW * 0.8; x <= scroll + 0.001; x += 0.06) behind.push([x, CRUISE + Math.sin((t - (scroll - x) / SPEED) * 1.6) * 0.03, routeZ(x)])
      for (let x = scroll; x <= scroll + WINDOW * 0.8; x += 0.06) ahead.push([x, CRUISE, routeZ(x)])
      for (let k = 1; k < behind.length; k++) {
        path([behind[k - 1], behind[k]])
        ctx.strokeStyle = col(WHITE, 0.8 * on * (k / behind.length))
        ctx.stroke()
      }
      ctx.setLineDash([3, 4])
      path(ahead)
      ctx.strokeStyle = col(pal.hi, 0.45 * on)
      ctx.stroke()
      ctx.setLineDash([])

      // Height above the ground: a dotted drop to the land and a mark where it meets it.
      const floor = height(planeAt[0], planeAt[2])
      ctx.setLineDash([1, 3])
      path([planeAt, [planeAt[0], floor, planeAt[2]]])
      ctx.strokeStyle = col(WHITE, 0.4 * on)
      ctx.stroke()
      ctx.setLineDash([])
      path(Array.from({ length: 13 }, (_, n) => [planeAt[0] + Math.cos((n / 12) * TAU) * 0.05, floor, planeAt[2] + Math.sin((n / 12) * TAU) * 0.05] as V3))
      ctx.stroke()

      // Pointed along the route, banked into its turns (by how fast the heading is changing).
      const slope = routeSlope(scroll)
      const fl = Math.hypot(1, slope)
      const fw: V3 = [1 / fl, 0, slope / fl]
      const rt: V3 = [-fw[2], 0, fw[0]]
      const turn = (routeSlope(scroll + 0.3) - routeSlope(scroll - 0.3)) / 0.6
      const bank = Math.max(-0.5, Math.min(0.5, turn * 0.9))
      const cb = Math.cos(bank), sb = Math.sin(bank)
      const up: V3 = [-rt[0] * sb, cb, -rt[2] * sb]
      const rtB: V3 = [rt[0] * cb, sb, rt[2] * cb]
      for (const part of PLANE) {
        path(part.map(([a, b, c]) => [0, 1, 2].map((j) => planeAt[j] + fw[j] * a + up[j] * b + rtB[j] * c) as V3))
        ctx.strokeStyle = col(WHITE, 0.95 * on)
        ctx.stroke()
      }
    },
  }
})()

const pulse = (p: number, at: number) => Math.max(0, 1 - Math.abs(p - at) / 0.02)

const whoOwnsSeattle: Scene = (() => {
  // South Lake Union from 1990 to 2025, in isometric: Lake Union to the north, Westlake cutting
  // across the west edge, the street grid down to Denny Way. As the years run, the low-rise
  // warehouses come down and towers go up (cranes and all), but each parcel's owner, developer,
  // trust or public, stays the same: the colour of a lot never changes, only what stands on it.
  //
  // Map units: one block. x runs east (0..COLS), z runs south from Valley St (0) to Denny (ROWS).
  const COLS = 6, ROWS = 6, ST = 0.09 // half a street's width
  /** Westlake Ave N, running up from Denny towards the lake, west of 9th. */
  const westlake = (z: number) => -0.4 + (z / ROWS) * 1.3
  /** The shore, just north of Valley St. */
  const shore = (x: number) => -0.18 - 0.12 * Math.sin(x * 1.1 + 0.6) - 0.06 * Math.sin(x * 2.7)
  const DEVELOPER = 0, TRUST = 1, PUBLIC = 2
  const yearAt = (p: number) => 1990 + clamp01(p * 1.1) * 35

  type Parcel = { poly: Pt[]; owner: number; oldH: number; rebuild: number; newH: number; podium: boolean; park: boolean; n: number }
  const rnd = seeded(21)
  const parcels: Parcel[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const z0 = r + ST, z1 = r + 1 - ST
      // Blocks against Westlake are cut along it.
      const west = (z: number) => (c === 0 ? Math.max(c + ST, westlake(z) + ST) : c + ST)
      const x1 = c + 1 - ST
      const split = rnd() < 0.6
      const halves = split ? [[0, 0.5 - 0.02], [0.5 + 0.02, 1]] : [[0, 1]]
      for (const [a, b] of halves) {
        const at = (u: number, z: number) => west(z) + (x1 - west(z)) * u
        const poly: Pt[] = [[at(a, z0), z0], [at(b, z0), z0], [at(b, z1), z1], [at(a, z1), z1]]
        // Lake Union Park along the shore; otherwise mostly developers, some trusts, a few public.
        const park = r === 0 && c >= 1 && c <= 2
        const roll = rnd()
        const owner = park ? PUBLIC : roll < 0.6 ? DEVELOPER : roll < 0.82 ? TRUST : PUBLIC
        const k = rnd(), q = rnd()
        // Only about half the developers' lots get a tower; the rest, and the trusts', go mid-rise.
        const tower = owner === DEVELOPER && rnd() < 0.5
        parcels.push({
          poly,
          owner,
          park,
          oldH: 0.1 + k * 0.25,
          // Developers rebuild in the boom (mostly 2006-2021), trusts earlier and slower, public
          // lots rarely.
          rebuild: park ? Infinity : owner === DEVELOPER ? 2006 + q * 15 : owner === TRUST ? 1996 + q * 20 : q < 0.5 ? 1998 + q * 24 : Infinity,
          newH: tower ? 1.5 + k * 1.6 : owner === PUBLIC ? 0.3 + k * 0.4 : 0.45 + k * 0.6,
          podium: tower && k > 0.25,
          n: parcels.length,
        })
      }
    }
  }
  /** Years the old building takes to come down, and the new one to go up. */
  const DEMO = 0.8, BUILD = 2.6, FLOOR = 0.12

  const shrink = (poly: Pt[], f: number): Pt[] => {
    const mx = poly.reduce((s, q) => s + q[0], 0) / poly.length, mz = poly.reduce((s, q) => s + q[1], 0) / poly.length
    return poly.map(([x, z]) => [mx + (x - mx) * f, mz + (z - mz) * f])
  }

  return {
    description:
      'A data visualizer that maps who owns Seattle, parcel by parcel, from King County property records.',
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      // Three steps from the highlight down towards the ground: developer, trust, public.
      const owners = [pal.hi, mix(pal.hi, pal.lo, 0.38), mix(pal.hi, pal.lo, 0.62)]
      const years = yearAt(p)
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2 - 6
      const ppu = Math.min(box.h / 8.4, box.w / 11.5)
      const yaw = ((30 + 4 * Math.sin(t * 0.3)) * Math.PI) / 180, pitch = (32 * Math.PI) / 180
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      // Orthographic, centred on the middle of the neighbourhood (a little north, for the lake).
      const CX = COLS / 2, CZ = ROWS / 2 - 0.9, CY = 0.8
      const project = (x: number, y: number, z: number): Pt => {
        const X = x - CX, Z = z - CZ
        const x1 = X * cyw + Z * syw, z1 = Z * cyw - X * syw
        return [cx + x1 * ppu, cy - ((y - CY) * cp - z1 * sp) * ppu]
      }
      const depth = (x: number, z: number) => (z - CZ) * cyw - (x - CX) * syw
      const line = (pts: V3[]) => {
        pts.forEach(([x, y, z], i) => {
          const [X, Y] = project(x, y, z)
          i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
        })
      }
      ctx.lineWidth = 1

      // ---- The lake: its shore and rows of ripples, fading out to the north ----
      ctx.beginPath()
      const shoreLine: V3[] = []
      for (let x = -0.9; x <= COLS + 0.4; x += 0.1) shoreLine.push([x, 0, shore(x)])
      line(shoreLine)
      ctx.strokeStyle = col(pal.hi, 0.5 * reveal)
      ctx.stroke()
      for (let k = 1; k <= 9; k++) {
        const a = (0.3 - k * 0.03) * reveal
        if (a <= 0) continue
        ctx.beginPath()
        for (let x = -0.9; x <= COLS + 0.4; x += 0.1) {
          const z = shore(x) - k * 0.22
          // Broken into dashes that drift, like light on water.
          if (Math.sin(x * 4 + k * 1.7 + t * 0.8) > -0.2) {
            const [X, Y] = project(x, 0, z)
            const [X2, Y2] = project(x + 0.1, 0, shore(x + 0.1) - k * 0.22)
            ctx.moveTo(X, Y)
            ctx.lineTo(X2, Y2)
          }
        }
        ctx.strokeStyle = col(pal.hi, a)
        ctx.stroke()
      }

      // ---- Streets: centrelines, faint, and Westlake on its diagonal ----
      ctx.beginPath()
      for (let c = 1; c <= COLS; c++) line([[c, 0, 0], [c, 0, ROWS]])
      for (let r = 0; r <= ROWS; r++) line([[westlake(r), 0, r], [COLS, 0, r]])
      line([[westlake(0), 0, 0], [westlake(ROWS), 0, ROWS]])
      ctx.strokeStyle = col(pal.hi, 0.16 * reveal)
      ctx.stroke()

      // ---- Buildings, back to front ----
      type Prism = { poly: Pt[]; y0: number; y1: number; owner: number; mode: 'solid' | 'frame'; d: number }
      const prisms: Prism[] = []
      const cranes: { x: number; z: number; h: number; n: number }[] = []
      const rise = easeOutCubic(clamp01(reveal * 1.4 - 0.2))
      for (const q of parcels) {
        const d = depth(...(q.poly.reduce((s, v) => [s[0] + v[0] / 4, s[1] + v[1] / 4], [0, 0]) as Pt))
        if (q.park) continue
        const since = years - q.rebuild
        if (since < DEMO) {
          // The old low-rise, coming down once its lot is sold on for a tower.
          const h = q.oldH * (since < 0 ? 1 : 1 - easeInOutCubic(since / DEMO)) * rise
          if (h > 0.005) prisms.push({ poly: shrink(q.poly, 0.9), y0: 0, y1: h, owner: q.owner, mode: 'solid', d })
          continue
        }
        const u = clamp01((since - DEMO) / BUILD)
        const done = u >= 1
        const H = q.newH * easeInOutCubic(u) * rise
        // Developers' towers stand on a podium that fills the lot.
        const podH = q.podium ? Math.min(H, 0.36) : 0
        if (podH > 0) prisms.push({ poly: shrink(q.poly, 0.92), y0: 0, y1: podH, owner: q.owner, mode: done ? 'solid' : 'frame', d })
        if (H > podH + 0.005) prisms.push({ poly: shrink(q.poly, q.podium ? 0.6 : 0.85), y0: podH, y1: H, owner: q.owner, mode: done ? 'solid' : 'frame', d: d + 0.001 })
        if (!done) {
          const [px, pz] = q.poly[1]
          cranes.push({ x: px + 0.05, z: pz - 0.05, h: q.newH * rise + 0.45, n: q.n })
        }
      }
      prisms.sort((a, b) => a.d - b.d || a.y0 - b.y0)

      // Ground: every lot outlined in its owner's colour, the park with its trees.
      for (const q of parcels) {
        ctx.beginPath()
        line([...q.poly, q.poly[0]].map(([x, z]) => [x, 0, z] as V3))
        ctx.strokeStyle = col(owners[q.owner], (q.park ? 0.7 : 0.45) * reveal)
        ctx.stroke()
        if (q.park) {
          const tr = seeded(q.n + 3)
          const [[ax, az], , [bx, bz]] = q.poly
          for (let k = 0; k < 7; k++) {
            const x = ax + (bx - ax) * (0.15 + tr() * 0.7), z = az + (bz - az) * (0.15 + tr() * 0.7)
            ctx.beginPath()
            line(Array.from({ length: 9 }, (_, n) => [x + Math.cos((n / 8) * TAU) * 0.06, 0.08 * rise, z + Math.sin((n / 8) * TAU) * 0.06] as V3))
            line([[x, 0, z], [x, 0.08 * rise, z]])
            ctx.strokeStyle = col(WHITE, 0.45 * reveal)
            ctx.stroke()
          }
        }
      }

      // Horizontal direction towards the camera, for picking the faces that show.
      const vx = -syw, vz = cyw
      for (const b of prisms) {
        const { poly, y0, y1 } = b
        const owner = owners[b.owner]
        const n = poly.length
        let area = 0
        for (let i = 0; i < n; i++) area += poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1]
        const sgn = area > 0 ? 1 : -1
        const faces: [Pt, Pt][] = []
        for (let i = 0; i < n; i++) {
          const a = poly[i], c = poly[(i + 1) % n]
          const nx = (c[1] - a[1]) * sgn, nz = -(c[0] - a[0]) * sgn
          if (nx * vx + nz * vz > 0) faces.push([a, c])
        }
        const top = poly.map(([x, z]) => [x, y1, z] as V3)
        if (b.mode === 'solid') {
          // Dark faces, so what's behind is hidden, then the edges and floors in the owner's colour.
          for (const [a, c] of faces) {
            ctx.beginPath()
            line([[a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]]])
            ctx.closePath()
            ctx.fillStyle = col(pal.lo, 0.94)
            ctx.fill()
            ctx.fillStyle = col(owner, 0.07)
            ctx.fill()
          }
          ctx.beginPath()
          line(top)
          ctx.closePath()
          ctx.fillStyle = col(pal.lo, 0.94)
          ctx.fill()
          ctx.fillStyle = col(owner, 0.22)
          ctx.fill()
          ctx.beginPath()
          for (let f = y0 + FLOOR; f < y1 - 0.03; f += FLOOR) for (const [a, c] of faces) line([[a[0], f, a[1]], [c[0], f, c[1]]])
          ctx.strokeStyle = col(owner, 0.28 * reveal)
          ctx.stroke()
          ctx.beginPath()
          line([...top, top[0]])
          for (const [a, c] of faces) {
            line([[a[0], y0, a[1]], [c[0], y0, c[1]]])
            line([[a[0], y0, a[1]], [a[0], y1, a[1]]])
            line([[c[0], y0, c[1]], [c[0], y1, c[1]]])
          }
          ctx.strokeStyle = col(owner, 0.9 * reveal)
          ctx.stroke()
        } else {
          // Going up: bare columns and a slab at every floor, see-through.
          ctx.beginPath()
          for (const [x, z] of poly) line([[x, y0, z], [x, y1, z]])
          for (let f = y0; f <= y1 + 1e-6; f += FLOOR) line([...poly, poly[0]].map(([x, z]) => [x, Math.min(f, y1), z] as V3))
          line([...top, top[0]])
          ctx.strokeStyle = col(owner, 0.55 * reveal)
          ctx.stroke()
        }
      }

      // Tower cranes over the sites going up, slewing slowly.
      for (const k of cranes) {
        const ang = t * 0.35 + k.n * 1.3
        const jx = Math.cos(ang), jz = Math.sin(ang)
        ctx.beginPath()
        line([[k.x, 0, k.z], [k.x, k.h, k.z]])
        line([[k.x - jx * 0.3, k.h, k.z - jz * 0.3], [k.x + jx * 0.95, k.h, k.z + jz * 0.95]])
        line([[k.x, k.h + 0.12, k.z], [k.x + jx * 0.95, k.h, k.z + jz * 0.95]])
        line([[k.x, k.h + 0.12, k.z], [k.x - jx * 0.3, k.h, k.z - jz * 0.3]])
        const hook = 0.55 + 0.35 * Math.sin(t * 0.9 + k.n)
        line([[k.x + jx * hook, k.h, k.z + jz * hook], [k.x + jx * hook, k.h * 0.45, k.z + jz * hook]])
        ctx.strokeStyle = col(WHITE, 0.7 * reveal)
        ctx.stroke()
      }

      // ---- Names on the map ----
      ctx.fillStyle = col(WHITE, 0.5 * reveal)
      ctx.textAlign = 'center'
      const name = (text: string, x: number, z: number, y = 0) => {
        const [X, Y] = project(x, y, z)
        label(ctx, text, X, Y, 8)
      }
      name('LAKE UNION', 2.6, -1.3)
      ctx.textAlign = 'left'
      name('MERCER ST', COLS + 0.25, 1)
      name('DENNY WAY', COLS + 0.25, ROWS)
      ctx.textAlign = 'right'
      name('WESTLAKE AVE N', westlake(4.5) - 0.2, 4.5)
      ctx.textAlign = 'left'

      // ---- Year scrubber, over the map ----
      const sw = Math.min(box.w * 0.4, 280), sx = cx - sw / 2, sy = box.y + 18
      ctx.strokeStyle = col(pal.hi, 0.35 * reveal)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + sw * reveal, sy)
      for (let n = 0; n <= 7; n++) {
        ctx.moveTo(sx + (sw * n) / 7, sy - 3)
        ctx.lineTo(sx + (sw * n) / 7, sy + 3)
      }
      ctx.stroke()
      const kx = sx + (sw * (years - 1990)) / 35
      ctx.fillStyle = col(WHITE, reveal)
      ctx.fillRect(kx - 1, sy - 8, 2, 16)
      ctx.textAlign = 'center'
      label(ctx, String(Math.floor(years)), kx, sy - 14, 9)
      ctx.textAlign = 'left'
    },
  }
})()

/**
 * Project Open's 3D model, as contour lines: the prototype's STL sliced into outlines along its
 * depth (see scripts/slice-model.mjs). Loaded once by createReel; the scene draws nothing of it
 * until it's in, which is long before its turn comes round.
 */
type ModelLine = { slice: number; pts: Float32Array }
type Model = { lines: ModelLine[]; slices: number }
let model: Model | null = null
let modelLoad: Promise<void> | null = null

/** Starts loading the model (once); resolves when it's in, so a still frame can be redrawn. */
function loadModel() {
  modelLoad ??= fetch(`${import.meta.env.BASE_URL}models/project-open.bin`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
    .then((buf) => {
      // Int16s: line count, then per line its part, slice and point count, then x y z per point
      // (each -1..1 as -32767..32767). The scene draws the piece whole, so parts aren't kept.
      const d = new Int16Array(buf)
      const lines: ModelLine[] = []
      let o = 1
      for (let n = 0; n < d[0]; n++) {
        const slice = d[o + 1], count = d[o + 2]
        o += 3
        const pts = new Float32Array(count * 3)
        for (let i = 0; i < count * 3; i++) pts[i] = d[o + i] / 32767
        o += count * 3
        lines.push({ slice, pts })
      }
      model = { lines, slices: Math.max(...lines.map((l) => l.slice)) + 1 }
    })
    .catch(() => {
      modelLoad = null // try again on the next reel
    })
  return modelLoad
}

type V3 = [number, number, number]

/**
 * The cup's inner workings, built as contour line art to match the scanned piece. Each part is
 * polylines in the cup's own frame: [across, up, along the cup's axis], in model units, centred
 * on the part. Sized against the cup (0.94 across, ~48mm), so the 40mm driver is 0.39 in radius.
 */
const driverParts = (() => {
  const ring = (r: number, w: number, n = 48, u0 = 0, v0 = 0, wobble?: (a: number) => number): V3[] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * TAU
      const rr = r + (wobble ? wobble(a) : 0)
      return [u0 + Math.cos(a) * rr, v0 + Math.sin(a) * rr, w] as V3
    })
  /** Rings stacked through a thickness, plus a few straight edges down the side. */
  const cylinder = (r: number, w0: number, w1: number, rings = 3, edges = 4) => [
    ...Array.from({ length: rings }, (_, i) => ring(r, w0 + ((w1 - w0) * i) / (rings - 1))),
    ...Array.from({ length: edges }, (_, i) => {
      const a = (i / edges) * TAU + 0.4
      return [[Math.cos(a) * r, Math.sin(a) * r, w0], [Math.cos(a) * r, Math.sin(a) * r, w1]] as V3[]
    }),
  ]
  const rect = (u: number, v: number, du: number, dv: number, w: number): V3[] => [
    [u - du, v - dv, w], [u + du, v - dv, w], [u + du, v + dv, w], [u - du, v + dv, w], [u - du, v - dv, w],
  ]

  // Front of the cup (away from the ear) and back (toward it), each listed from the cup outward.
  const grille: V3[][] = [ring(0.42, -0.012), ring(0.42, 0.012), ring(0.36, 0.012)]
  for (let v = -0.32; v <= 0.32; v += 0.07) {
    for (let u = -0.32; u <= 0.32; u += 0.07) {
      const uu = u + (Math.round(v / 0.07) % 2 ? 0.035 : 0)
      if (Math.hypot(uu, v) < 0.31) grille.push(ring(0.016, 0.012, 8, uu, v))
    }
  }

  const driver: V3[][] = [ring(0.39, 0.04), ring(0.36, 0.04), ring(0.2, -0.07), ...cylinder(0.13, -0.07, -0.17, 4, 6)]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.26
    driver.push([[Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0.04], [Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.07]])
  }

  // Frustum rings from the surround down to the dust cap, then the cap's dome.
  const cone: V3[][] = [ring(0.37, 0.06), ring(0.355, 0.07)]
  for (let i = 0; i <= 6; i++) cone.push(ring(0.34 - i * 0.042, 0.06 - i * 0.022, 40))
  cone.push(ring(0.06, -0.06, 24), ring(0.035, -0.045, 20))

  const foam: V3[][] = Array.from({ length: 5 }, (_, i) =>
    ring(0.35, -0.03 + i * 0.015, 64, 0, 0, (a) => 0.008 * Math.sin(a * 9 + i * 1.3)),
  )

  const coil: V3[][] = [ring(0.1, -0.07, 32), ring(0.1, 0.07, 32)]
  coil.push(Array.from({ length: 8 * 24 + 1 }, (_, i) => {
    const a = (i / 24) * TAU
    return [Math.cos(a) * 0.107, Math.sin(a) * 0.107, -0.055 + (0.11 * i) / (8 * 24)] as V3
  }))

  const pcb: V3[][] = [ring(0.3, -0.008), ring(0.3, 0.008), ring(0.035, 0.008, 16)]
  pcb.push(rect(-0.08, 0.06, 0.06, 0.045, 0.02), rect(0.1, -0.04, 0.045, 0.045, 0.02), rect(-0.02, -0.15, 0.09, 0.025, 0.018))
  pcb.push(rect(0.14, 0.12, 0.025, 0.018, 0.016), rect(-0.18, -0.05, 0.02, 0.03, 0.016))
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU
    pcb.push(ring(0.012, 0.008, 8, Math.cos(a) * 0.25, Math.sin(a) * 0.25))
  }

  const cell: V3[][] = [...cylinder(0.16, -0.025, 0.025, 2, 6), ring(0.13, 0.03, 40)]

  return [
    { label: 'CONE', lines: cone, side: 1, slot: 0 },
    { label: '40MM DRIVER', lines: driver, side: 1, slot: 1 },
    { label: 'GRILLE', lines: grille, side: 1, slot: 2 },
    { label: 'DAMPING FOAM', lines: foam, side: -1, slot: 0 },
    { label: 'COIL', lines: coil, side: -1, slot: 1 },
    { label: 'PCB', lines: pcb, side: -1, slot: 2 },
    { label: 'CELL', lines: cell, side: -1, slot: 3 },
  ]
})()

const projectOpen: Scene = (() => {
  // The prototype in isometric (orthographic, the true iso angles), taking itself apart and
  // putting itself back together. The story: the contours draw on from the back of the piece to
  // the front -> one by one the cup's workings burst out of both faces, tumbling, each blast
  // jolting the piece -> they hang in an exploded view with callouts -> they're pulled back in
  // and slam home, innermost first, each landing shaking and lighting the piece.
  /** The piece (2 units tall) fills this share of the frame height. */
  const FILL = 0.4
  // Isometric-style: orthographic, looking down a little lower than true iso (24 degrees, not
  // 35.3), easing round from 10 degrees off the side view to the iso quarter turn (45).
  const YAW_FROM = (10 * Math.PI) / 180, YAW_TO = Math.PI / 4
  const PITCH = (24 * Math.PI) / 180
  // The cup, measured from the model: its centre, the axis it faces out along, and a frame
  // (across, up) square to that axis.
  const CUP: V3 = [0.348, -0.126, 0.158]
  const AX: V3 = [0.341, 0.015, 0.94]
  const ACROSS: V3 = (() => {
    const c: V3 = [AX[2], 0, -AX[0]] // axis x up
    const l = Math.hypot(...c)
    return [c[0] / l, c[1] / l, c[2] / l]
  })()
  const UP: V3 = [AX[1] * ACROSS[2] - AX[2] * ACROSS[1], AX[2] * ACROSS[0] - AX[0] * ACROSS[2], AX[0] * ACROSS[1] - AX[1] * ACROSS[0]]
  /**
   * Where the parts come to rest along the axis, either way from the cup's centre: a clear gap
   * off its face in front and past the hook behind, then spaced out.
   */
  const OUT_FRONT = 0.9, OUT_BACK = 1.35, GAP = 0.56

  // A 3D graph under the piece: a gridded floor, half-width G, at FLOOR, lines every STEP. It
  // fades out from the middle (visible under the piece, all but gone at the edges), so it's cut
  // into short segments, each sorted once into one of BANDS brightness bands.
  const G = 3.2, FLOOR = -1.15, STEP = 0.4, BANDS = 8
  const graphBands: V3[][] = Array.from({ length: BANDS }, () => [])
  {
    const lines: [V3, V3][] = []
    for (let k = -G; k <= G + 1e-6; k += STEP) lines.push([[k, FLOOR, -G], [k, FLOOR, G]], [[-G, FLOOR, k], [G, FLOOR, k]])
    for (const [a, b] of lines) {
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.1))
      for (let i = 0; i < n; i++) {
        const p0 = [0, 1, 2].map((j) => a[j] + ((b[j] - a[j]) * i) / n) as V3
        const p1 = [0, 1, 2].map((j) => a[j] + ((b[j] - a[j]) * (i + 1)) / n) as V3
        // Distance from the floor's centre, under the piece.
        const r = Math.hypot((p0[0] + p1[0]) / 2, (p0[2] + p1[2]) / 2) / (G * 1.1)
        const w = Math.pow(1 - clamp01((r - 0.15) / 0.85), 2)
        const band = Math.round(w * (BANDS - 1))
        if (band > 0) graphBands[band].push(p0, p1)
      }
    }
  }
  /** Beats, as fractions of the scene: bursts start at BURST and follow every BURST_STEP; the pull home starts at HOME. */
  const BURST = 0.14, BURST_STEP = 0.045, HOME = 0.58, HOME_STEP = 0.04
  /** How long a part takes to fly out, and to be pulled back in. */
  const FLY_OUT = 0.07, FLY_IN = 0.06
  /** How fast a jolt dies away (per unit of p; ~0.4s). */
  const DECAY = 55

  const hash = (n: number) => {
    const x = Math.sin(n * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }
  const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2)
  const easeInCubic = (x: number) => x * x * x
  const jolt = (p: number, at: number) => (p >= at ? Math.exp(-(p - at) * DECAY) : 0)

  // Outermost first, alternating faces, so the piece comes apart from the outside in. Each part
  // gets its own tumble (an axis in its plane and how far it turns) and a sideways swerve.
  const order = [...driverParts].sort((a, b) => b.slot - a.slot || b.side - a.side)
  const plan = order.map((part, i) => ({
    part,
    burst: BURST + i * BURST_STEP,
    // Pulled home in reverse: the last out (innermost) goes back first.
    home: HOME + (order.length - 1 - i) * HOME_STEP,
    spinAxis: hash(i + 1) * TAU,
    spinOut: (hash(i + 11) > 0.5 ? 1 : -1) * (1.6 + hash(i + 21)),
    spinIn: (hash(i + 31) > 0.5 ? 1 : -1) * (1 + hash(i + 41)),
    swerve: (hash(i + 51) - 0.5) * 0.7,
    rest: (part.side > 0 ? OUT_FRONT : OUT_BACK) + part.slot * GAP,
  }))

  /** Rotates a local [across, up, along] point about an axis in the part's plane. */
  const tumble = ([u, v, w]: V3, axisAngle: number, angle: number): V3 => {
    if (!angle) return [u, v, w]
    const kx = Math.cos(axisAngle), ky = Math.sin(axisAngle)
    const c = Math.cos(angle), s = Math.sin(angle), dot = kx * u + ky * v
    // Rodrigues, with the axis (kx, ky, 0).
    return [
      u * c + ky * w * s + kx * dot * (1 - c),
      v * c - kx * w * s + ky * dot * (1 - c),
      w * c + (kx * v - ky * u) * s,
    ]
  }

  return {
    description:
      'Open-back headphones for city life, with a bandless hook that sits over the ear instead of a headband.',
    draw: ({ ctx, box, p, t, reveal, col, pal }) => {
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2 - 12
      // Pixels per model unit: FILL of the frame, less on narrow frames so the exploded view
      // (about 2.3 units either side of centre, once foreshortened) still fits across.
      const ppu = Math.min((FILL * box.h) / 2, box.w / 2 / 2.3)

      // Every burst and every landing jolts the piece; landings hit harder.
      let hit = 0
      for (const q of plan) hit += 0.6 * jolt(p, q.burst) + jolt(p, q.home + FLY_IN)
      hit = Math.min(1.4, hit)
      // The jolt shakes the whole piece a little and shears its contours apart.
      const shakeX = Math.sin(t * 57) * 0.025 * hit, shakeY = Math.cos(t * 43) * 0.02 * hit

      const yaw = YAW_FROM + (YAW_TO - YAW_FROM) * ramp(p, 0, 0.85)
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(PITCH), sp = Math.sin(PITCH)
      /** Model point -> screen point and depth (-1 far .. 1 near, roughly). Orthographic. */
      const project = (x: number, y: number, z: number): V3 => {
        const x1 = x * cyw + z * syw, z1 = z * cyw - x * syw
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp
        return [cx + x1 * ppu, cy - y2 * ppu, z2]
      }
      const stroke = (n: number, at: (i: number) => V3, tint: number, a: number) => {
        let depth = 0
        ctx.beginPath()
        for (let i = 0; i < n; i++) {
          const [X, Y, Z] = at(i)
          i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
          depth += Z
        }
        // Depth cue: the near side reads brighter than the far side.
        const near = clamp01((depth / n + 1) / 2)
        ctx.strokeStyle = col(mix(pal.hi, WHITE, Math.min(1, tint + 0.25 * near)), Math.min(1, (0.18 + 0.62 * near) * a))
        ctx.stroke()
      }
      ctx.lineWidth = 1

      // The graph, drawing on with the scene: one path per brightness band.
      graphBands.forEach((segs, band) => {
        if (!segs.length) return
        ctx.beginPath()
        for (let i = 0; i < segs.length; i += 2) {
          const [x0, y0] = project(...segs[i]), [x1, y1] = project(...segs[i + 1])
          ctx.moveTo(x0, y0)
          ctx.lineTo(x1, y1)
        }
        ctx.strokeStyle = col(pal.hi, 0.26 * (band / (BANDS - 1)) * reveal)
        ctx.stroke()
      })

      if (model) {
        // Draws on (and off, at the handoff) as a sweep through the slices, back to front.
        const FEATHER = 10
        const sweep = reveal * (model.slices + FEATHER)
        for (const line of model.lines) {
          const on = clamp01((sweep - line.slice) / FEATHER)
          if (on <= 0) continue
          const q = line.pts
          // Each slice slips sideways by its own amount while the piece is jolted.
          const slip = (hash(line.slice) - 0.5) * 0.16 * hit
          const ox = shakeX + ACROSS[0] * slip, oy = shakeY + ACROSS[1] * slip, oz = ACROSS[2] * slip
          stroke(q.length / 3, (i) => project(q[i * 3] + ox, q[i * 3 + 1] + oy, q[i * 3 + 2] + oz), 0.35 * Math.min(1, hit), on * (1 + 0.4 * hit))
        }
      }

      const labels: [string, number, number, number][] = []
      plan.forEach((q, k) => {
        const { part } = q
        const uo = clamp01((p - q.burst) / FLY_OUT), ui = clamp01((p - q.home) / FLY_IN)
        const out = easeOutBack(uo) * (1 - easeInCubic(ui))
        const d = part.side * q.rest * out
        // Hidden while inside the cup; it appears as it clears the face.
        const a = clamp01((Math.abs(d) - 0.3) / 0.15) * reveal
        if (a <= 0) return
        // Tumbles out and settles square; tumbles again as it's dragged home. Swerves in flight.
        const angle = q.spinOut * (1 - easeOutCubic(uo)) + q.spinIn * easeInCubic(ui)
        const swerve = q.swerve * (Math.sin(Math.PI * uo) * (1 - uo) + Math.sin(Math.PI * ui))
        const bob = Math.sin(t * 1.4 + k * 1.7) * 0.02 * out
        const toModel = (pt: V3): V3 => {
          const [u, v, w] = tumble(pt, q.spinAxis, angle)
          const along = d + w
          return [0, 1, 2].map((j) => CUP[j] + AX[j] * along + ACROSS[j] * u + UP[j] * (v + bob + swerve)) as V3
        }
        for (const line of part.lines) stroke(line.length, (i) => project(...toModel(line[i])), 0.3, a)
        // Callout above (or, alternating, below) the part while it hangs in the exploded view.
        // (Behind the cup the pattern flips, so the nearest part's callout clears the hook.)
        const below = (part.slot + (part.side < 0 ? 1 : 0)) % 2
        const [lx, ly, lz] = project(...toModel([0, below ? -0.5 : 0.5, 0]))
        const shown = clamp01((p - q.burst - FLY_OUT) / 0.04) * (1 - clamp01((p - q.home) / 0.02))
        labels.push([part.label, lx, ly, shown * reveal * (0.5 + 0.4 * clamp01((lz + 1) / 2))])
      })
      ctx.textAlign = 'center'
      for (const [text, x, y, a] of labels) {
        if (a <= 0) continue
        ctx.fillStyle = col(WHITE, a)
        label(ctx, text, x, y, 9)
      }
      ctx.textAlign = 'left'

      // Oscilloscope along the top, centred; it spikes with each jolt.
      const wy = box.y + 10, ww = Math.min(box.w * 0.46, ppu * 2.4), wx = cx - ww / 2
      const amp = 1 + 1.5 * hit
      ctx.beginPath()
      for (let i = 0; i <= 200 * reveal; i++) {
        const u = i / 200
        const Y = wy + (Math.sin(u * 40 + t * 8) * 6 * Math.sin(u * Math.PI) + Math.sin(u * 13 - t * 3) * 3 * Math.sin(u * Math.PI)) * amp
        i ? ctx.lineTo(wx + u * ww, Y) : ctx.moveTo(wx, Y)
      }
      ctx.strokeStyle = col(pal.hi, 0.8)
      ctx.stroke()
    },
  }
})()

const SCENES: Scene[] = [projectOpen, xbox, foreflight, whoOwnsSeattle]
export const SCENE_COUNT = SCENES.length

/**
 * Start of the slot that draws itself on from nothing, with no handoff bringing it in: the first
 * one on load, or wherever a jump landed. Module-level so a remount mid-slot doesn't lose it.
 */
let freshAt = 0

// ---------- Engine ----------

/**
 * bottomPad: a band at the foot kept clear of the HUD and the scenes, for when the page fades
 * the canvas out at the bottom edge.
 */
export function createReel(canvas: HTMLCanvasElement, { bottomPad = 0 } = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const modelReady = loadModel()
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
    /** Resolves once Project Open's model is in (or failed), for redrawing a still frame. */
    modelReady,

    /** A clock time, after `time`, where scene i starts fresh (draws on from nothing). */
    jumpTo(i: number, time: number) {
      const cycle = SCENES.length * SCENE_SECONDS
      freshAt = Math.ceil((time + 0.001) / cycle) * cycle + i * SCENE_SECONDS
      return freshAt
    },

    resize(width: number, height: number, ratio: number) {
      w = width
      h = height
      dpr = ratio
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    },

    draw(time: number, pal: Palette, pointer: Pointer): Hud | undefined {
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
      // handoff that brought it in, a handoff's length before its slot. A fresh scene (the first on
      // load, or one jumped to) had no handoff, so its clock runs a little fast to fit its whole
      // life into the slot.
      const phase = tt - idx * SCENE_SECONDS
      const fresh = time >= freshAt && time < freshAt + SCENE_SECONDS
      const local = fresh ? phase * (LIFE_SECONDS / SCENE_SECONDS) : phase + HANDOFF_SECONDS
      const next = (idx + 1) % SCENES.length
      // The stage: the space between the HUD's top and bottom bands, where each scene composes
      // itself around the centre. Big frames scale the scenes up (to 1.5x) instead of spreading
      // them out, and very wide ones just get more margin, so the work stays gathered in the middle.
      const aw = w - 2 * m - 16, ah = h - bottomPad - 2 * m - 170
      const k = Math.min(1.5, Math.max(1, ah / 600))
      const bh = ah / k, bw = Math.min(aw / k, bh * 2.3)
      const stage: Stage = { x: m + 8 + (aw - bw * k) / 2, y: m + 44, k, box: { x: 0, y: 0, w: bw, h: bh } }

      // Handoff: the last stretch of each slot, where this scene draws itself off as the next one
      // draws on over it. q runs 0..1 through it (0 when there isn't one under way).
      const handoffAt = SCENE_SECONDS - HANDOFF_SECONDS
      const q = phase > handoffAt ? (phase - handoffAt) / HANDOFF_SECONDS : 0
      drawScene(SCENES[idx], local, stage, pal)
      if (q > 0) drawScene(SCENES[next], phase - handoffAt, stage, pal)

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
      // The words hand over too: the old description lifts away as it fades, the new one rises into place.
      const fade = q > 0 ? easeInOutCubic(Math.abs(q - 0.5) * 2) : clamp01(local / 0.6)
      const lift = (1 - fade) * 8 * (q > 0 && q < 0.5 ? -1 : 1)

      // Description, bottom left, wrapped and stacked up from its last line. The call to action
      // under it is a DOM link (see HomeHeader), placed from the HUD state this returns.
      const hb = h - bottomPad // the HUD's floor
      const ty = hb - m - 54 + lift
      const size = w < 640 ? 14 : 16, leading = Math.round(size * 1.45)
      ctx.font = `500 ${size}px "Open Sauce One", system-ui, sans-serif`
      const lines = wrap(ctx, shown.description, Math.min(460, w - 2 * m - 16))
      ctx.fillStyle = col(WHITE, fade)
      lines.forEach((line, i) => label(ctx, line, m + 8, ty - 16 - (lines.length - 1 - i) * leading, size, 500))

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

      return {
        x: m + 8,
        y: ty - lift + 12, // a small gap under the description
        bar: { x: w - m - 8 - SCENES.length * (segW + 4) + 4, y: segY - 11 },
        idx,
      }
    },
  }
}

/** A scene time that shows a settled frame (for reduced motion). */
export const STILL_TIME = SCENE_SECONDS * 0.55
