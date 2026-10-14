import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { useScanReveal } from './Stage'

/**
 * ```3d-model — the path to a contour model: an STL sliced into outlines by
 * scripts/slice-model.mjs (the same file the home reel draws Project Open from). Drawn in ink on
 * the page grey, orthographic: the slices sweep on back to front as it scrolls in, then it turns
 * slowly on its own; drag to turn it yourself. Nearer lines read darker than farther ones.
 */

type Line = { slice: number; pts: Float32Array }

/** Int16s: line count, then per line its part, slice and point count, then x y z per point (±32767 = ±1). */
function decode(buf: ArrayBuffer) {
  const d = new Int16Array(buf)
  const lines: Line[] = []
  let o = 1
  for (let n = 0; n < d[0]; n++) {
    const slice = d[o + 1]
    const count = d[o + 2]
    o += 3
    const pts = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) pts[i] = d[o + i] / 32767
    o += count * 3
    lines.push({ slice, pts })
  }
  return { lines, slices: Math.max(...lines.map((l) => l.slice)) + 1 }
}

/** Depth bands the lines are sorted into each frame, so a frame is a handful of strokes. */
const BANDS = 6
const PITCH = (18 * Math.PI) / 180
/** Radians per second of the idle turn, and per pixel dragged. */
const IDLE_SPEED = 0.25
const DRAG_SPEED = 0.008
/** Slices that are partway on at once during the sweep. */
const FEATHER = 10

export function ContourModel({ content }: { content: string }) {
  const src = content.split('\n')[0]?.trim() || '/models/project-open.bin'
  const root = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useScanReveal(root)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let model: ReturnType<typeof decode> | null = null
    let yaw = Math.PI / 4
    let pitch = PITCH
    let spin = 0 // velocity left over from a drag, decaying back to the idle turn
    const show = { reveal: reduced ? 1 : 0 }
    let visible = false
    let dragging: { x: number; y: number } | null = null
    let last = performance.now()

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr)
      if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (!model) return

      const ppu = Math.min(w, h) * 0.42
      const cx = w / 2
      const cy = h / 2
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      const paths = Array.from({ length: BANDS }, () => new Path2D())
      const sweep = show.reveal * (model.slices + FEATHER)

      for (const line of model.lines) {
        if (sweep - line.slice <= 0) continue
        const q = line.pts
        const n = q.length / 3
        let depth = 0
        let path: Path2D | null = null
        const xy: number[] = []
        for (let i = 0; i < n; i++) {
          const x = q[i * 3], y = q[i * 3 + 1], z = q[i * 3 + 2]
          const x1 = x * cyw + z * syw, z1 = z * cyw - x * syw
          const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp
          xy.push(cx + x1 * ppu, cy - y2 * ppu)
          depth += z2
        }
        const band = Math.max(0, Math.min(BANDS - 1, Math.round(((depth / n + 1) / 2) * (BANDS - 1))))
        path = paths[band]
        path.moveTo(xy[0], xy[1])
        for (let i = 2; i < xy.length; i += 2) path.lineTo(xy[i], xy[i + 1])
      }
      ctx.lineWidth = 1
      paths.forEach((path, band) => {
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + 0.6 * (band / (BANDS - 1))})`
        ctx.stroke(path)
      })
    }

    const tick = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      if (!dragging) {
        spin *= Math.pow(0.04, dt) // a flick coasts, then settles back into the idle turn
        yaw += spin * dt + (reduced ? 0 : IDLE_SPEED * dt)
      }
      draw()
    }

    const down = (e: PointerEvent) => {
      dragging = { x: e.clientX, y: e.clientY }
      spin = 0
      canvas.setPointerCapture(e.pointerId)
      canvas.dataset.dragging = ''
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - dragging.x
      const dy = e.clientY - dragging.y
      dragging = { x: e.clientX, y: e.clientY }
      yaw += dx * DRAG_SPEED
      pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * DRAG_SPEED))
      spin = (dx * DRAG_SPEED) / 0.016
      if (reduced) draw()
    }
    const up = () => {
      dragging = null
      delete canvas.dataset.dragging
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)

    // Only turning while on screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      last = performance.now()
      if (visible) draw()
    })
    io.observe(canvas)
    gsap.ticker.add(tick)

    let sweep: gsap.core.Tween | null = null
    let trigger: ScrollTrigger | null = null
    fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((buf) => {
        model = decode(buf)
        if (reduced) return draw()
        // The slices sweep on, back to front, as the block scrolls in.
        trigger = ScrollTrigger.create({
          trigger: canvas,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            sweep = gsap.to(show, { reveal: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: draw })
          },
        })
      })
      .catch(() => {})

    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      sweep?.kill()
      trigger?.kill()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [src])

  return (
    <div ref={root} className="proto-stage proto-model">
      <canvas ref={canvasRef} className="proto-model-canvas" aria-label="3D contour model of the headset; drag to rotate" role="img" />
      <p className="proto-model-hint">Drag to rotate</p>
    </div>
  )
}
