/*
 * Turns an STL into the contour-line model the home header's reel draws (Project Open's scene in
 * src/lib/workReel.ts): the mesh is sliced along its depth into outlines, each part (connected
 * piece of the mesh) kept separate so the scene can pull them apart, then simplified and packed.
 *
 *   node scripts/slice-model.mjs path/to/model.stl [slices=64] [out=public/models/project-open.bin]
 *
 * Output is Int16s: line count, then per line its part, slice and point count, then x y z per
 * point, normalised so the model's longest side spans -1..1 (stored as -32767..32767).
 */
import fs from 'fs'

const [src, slicesArg = '64', out = 'public/models/project-open.bin'] = process.argv.slice(2)
if (!src) throw new Error('usage: node scripts/slice-model.mjs model.stl [slices] [out]')
const SLICES = Number(slicesArg)
const AXIS = 2 // slice along depth: seen from the front, the outlines stack into the side view
const EPS = 0.004 // simplification tolerance, in normalised units

// Binary STL: 80-byte header, triangle count, then 50 bytes per triangle. Welded by position.
const buf = fs.readFileSync(src)
const n = buf.readUInt32LE(80)
const ids = new Map(), verts = [], tris = new Uint32Array(n * 3)
for (let i = 0; i < n; i++) {
  const o = 84 + i * 50 + 12
  for (let v = 0; v < 3; v++) {
    const p = [0, 1, 2].map((d) => buf.readFloatLE(o + v * 12 + d * 4))
    const k = p.map((x) => Math.round(x * 1e4)).join(',')
    let id = ids.get(k)
    if (id === undefined) {
      id = verts.length
      verts.push(p)
      ids.set(k, id)
    }
    tris[i * 3 + v] = id
  }
}

// Parts: connected components, by union-find over each triangle's corners.
const parent = verts.map((_, i) => i)
const find = (x) => {
  while (parent[x] !== x) x = parent[x] = parent[parent[x]]
  return x
}
for (let i = 0; i < n; i++) {
  const a = find(tris[i * 3])
  parent[find(tris[i * 3 + 1])] = a
  parent[find(tris[i * 3 + 2])] = a
}
const partOf = new Map(), triPart = new Uint16Array(n)
for (let i = 0; i < n; i++) {
  const r = find(tris[i * 3])
  if (!partOf.has(r)) partOf.set(r, partOf.size)
  triPart[i] = partOf.get(r)
}

const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
for (const p of verts) p.forEach((x, d) => ((min[d] = Math.min(min[d], x)), (max[d] = Math.max(max[d], x))))
const center = min.map((m, d) => (m + max[d]) / 2)
const scale = 2 / Math.max(...max.map((m, d) => m - min[d]))

// Slice: each triangle crossing a plane gives a segment; segments chain into outlines.
const key = (p) => p.map((x) => Math.round(x * 1e5)).join(',')
const lines = []
for (let s = 0; s < SLICES; s++) {
  const c = min[AXIS] + ((max[AXIS] - min[AXIS]) * (s + 0.5)) / SLICES
  const byPart = new Map()
  for (let i = 0; i < n; i++) {
    const P = [0, 1, 2].map((v) => verts[tris[i * 3 + v]])
    const hit = []
    for (let e = 0; e < 3; e++) {
      const a = P[e], b = P[(e + 1) % 3], da = a[AXIS] - c, db = b[AXIS] - c
      if (da < 0 !== db < 0) hit.push(a.map((x, d) => x + ((b[d] - x) * da) / (da - db)))
    }
    if (hit.length === 2) {
      if (!byPart.has(triPart[i])) byPart.set(triPart[i], [])
      byPart.get(triPart[i]).push(hit)
    }
  }
  for (const [part, segs] of byPart) {
    const ends = new Map()
    segs.forEach((sg, i) => sg.forEach((p, j) => {
      const k = key(p)
      if (!ends.has(k)) ends.set(k, [])
      ends.get(k).push([i, j])
    }))
    const used = new Uint8Array(segs.length)
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue
      used[i] = 1
      const chain = [segs[i][0], segs[i][1]]
      for (const forward of [true, false]) {
        let end = forward ? chain[chain.length - 1] : chain[0]
        for (;;) {
          const next = (ends.get(key(end)) || []).find(([k]) => !used[k])
          if (!next) break
          used[next[0]] = 1
          end = segs[next[0]][1 - next[1]]
          forward ? chain.push(end) : chain.unshift(end)
        }
      }
      lines.push({ part, slice: s, pts: chain.map((p) => p.map((x, d) => (x - center[d]) * scale)) })
    }
  }
}

// Douglas-Peucker in 3D.
function simplify(pts) {
  if (pts.length < 3) return pts
  const a = pts[0], b = pts[pts.length - 1]
  const ab = b.map((x, d) => x - a[d]), len = Math.hypot(...ab)
  let far = 0, at = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const ap = pts[i].map((x, d) => x - a[d])
    const cross = [ab[1] * ap[2] - ab[2] * ap[1], ab[2] * ap[0] - ab[0] * ap[2], ab[0] * ap[1] - ab[1] * ap[0]]
    const dist = len > 1e-8 ? Math.hypot(...cross) / len : Math.hypot(...ap)
    if (dist > far) (far = dist), (at = i)
  }
  if (far < EPS) return [a, b]
  return [...simplify(pts.slice(0, at + 1)).slice(0, -1), ...simplify(pts.slice(at))]
}

const packed = lines.map((l) => ({ ...l, pts: simplify(l.pts) })).filter((l) => l.pts.length > 1)
const data = [packed.length]
for (const l of packed) {
  data.push(l.part, l.slice, l.pts.length)
  for (const p of l.pts) for (const x of p) data.push(Math.round(Math.max(-1, Math.min(1, x)) * 32767))
}
fs.writeFileSync(out, Buffer.from(new Int16Array(data).buffer))
console.log(`${packed.length} outlines, ${partOf.size} parts -> ${out}`)
