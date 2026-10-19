import { useEffect, useRef } from 'react'
import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl'

/*
 * The Who Owns Seattle case study hero: the opening of the live site at /who, rebuilt here rather
 * than shown as a picture. South Lake Union in 3D, every building, road and stretch of water in
 * a greyish black (the live site's red, recoloured) on its paper, turning slowly under a grain. The
 * paper is up from the first frame, covering the study's still and meeting the Work page card,
 * which washes out to it as it grows in; the map fades in once its tiles are drawn. The map's
 * style, camera and spin are the site's own (public/who), and maplibre only loads once this hero
 * is on the page.
 */

const PAPER = '#f4f4f2'
/** The map's one ink, a greyish black, where the live site uses its red. */
const INK = '#2e2e2c'
/** Degrees the map turns per second. */
const SPIN = 2.4
const ROADS = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']

const STYLE: StyleSpecification = {
  version: 8,
  sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  light: { anchor: 'viewport', color: '#ffffff', intensity: 0.4, position: [1.4, 230, 35] },
  layers: [
    { id: 'paper', type: 'background', paint: { 'background-color': PAPER } },
    { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': INK, 'fill-opacity': 0.1 } },
    { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': INK } },
    {
      id: 'roads',
      type: 'line',
      source: 'omt',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ROADS]],
      paint: {
        'line-color': INK,
        'line-opacity': 0.32,
        'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 0.3, 16, 3],
      },
    },
    {
      id: 'buildings',
      type: 'fill-extrusion',
      source: 'omt',
      'source-layer': 'building',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': INK,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.88,
      },
    },
  ],
}

export function WosSite() {
  const mapEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mapEl.current!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let map: MapLibreMap | undefined
    let frame = 0
    let last = 0
    let inView = true
    let disposed = false

    const turn = (t: number) => {
      if (last) map!.setBearing(map!.getBearing() + ((t - last) / 1000) * SPIN)
      last = t
      frame = requestAnimationFrame(turn)
    }
    const start = () => {
      if (map && !frame && !still && inView && !document.hidden) {
        last = 0
        frame = requestAnimationFrame(turn)
      }
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })
    io.observe(el)
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    // maplibre finds its worker next to its own file, which a bundle doesn't keep, so it's handed
    // the worker's built URL instead.
    Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(([{ Map, setWorkerUrl }, { default: workerUrl }]) => {
      if (disposed) return
      setWorkerUrl(workerUrl)
      try {
        map = new Map({
          container: el,
          style: STYLE,
          center: [-122.3372, 47.6205],
          zoom: 14,
          pitch: 60,
          bearing: -20,
          maxPitch: 70,
          interactive: false,
          attributionControl: false,
          fadeDuration: 0,
        })
      } catch {
        return // No WebGL: the paper, grain and copy still stand on their own.
      }
      map.once('load', () => {
        el.classList.add('is-ready')
        start()
      })
    })

    return () => {
      disposed = true
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      map?.remove()
    }
  }, [])

  return (
    <div className="wos-site">
      <div ref={mapEl} className="wos-site-map" aria-hidden="true" />
      <div className="wos-site-grain" aria-hidden="true" />
    </div>
  )
}
