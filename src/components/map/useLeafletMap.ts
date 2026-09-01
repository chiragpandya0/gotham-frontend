import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import type { Camera, TraceSighting } from '../../types/domain'
import { colorFor } from './colorFor'
import { useRoadRoute } from '../../hooks/useRoadRoute'
import { cartoTileUrl } from '../../lib/cartoTileUrl'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPopupHtml(c: Camera): string {
  const codec = c.codec ? escapeHtml(c.codec.toUpperCase()) : 'not reported'
  const res = c.resolution ? escapeHtml(c.resolution) : 'not reported'
  const fps = c.declared_fps ? `${c.declared_fps} fps` : 'not reported'
  const br = c.bitrate_kbps ? `${c.bitrate_kbps} kbps` : 'not reported'
  const warn = c.codec
    ? ''
    : `<div style="margin-top:8px;padding-top:7px;border-top:1px solid #1D3040;color:#E8A33D;font-size:11px">Stream properties unknown. Probe before batching inference.</div>`
  return (
    `<b style="font-size:13px">${escapeHtml(c.display_label ?? c.name)}</b>` +
    `<div style="color:#93AEBF;margin:2px 0 8px">${escapeHtml(c.district ?? '')} &nbsp;·&nbsp; ${escapeHtml(c.department ?? '')} department</div>` +
    `<table style="font-size:11.5px;border-spacing:0 3px">` +
    `<tr><td style="color:#63808F;padding-right:12px">Adapter</td><td style="font-family:var(--mono)">${escapeHtml(c.adapter ?? '—')}</td></tr>` +
    `<tr><td style="color:#63808F">Codec</td><td style="font-family:var(--mono)">${codec}</td></tr>` +
    `<tr><td style="color:#63808F">Resolution</td><td style="font-family:var(--mono)">${res}</td></tr>` +
    `<tr><td style="color:#63808F">Frame rate</td><td style="font-family:var(--mono)">${fps}</td></tr>` +
    `<tr><td style="color:#63808F">Bitrate</td><td style="font-family:var(--mono)">${br}</td></tr></table>` +
    warn
  )
}

interface UseLeafletMapOptions {
  containerId: string
  cameras: Camera[]
  sightings: TraceSighting[]
  /** Whether the containing view is currently visible — drives invalidateSize(). */
  active: boolean
}

// Thin imperative wrapper porting the mockup's initMap()/drawRoute()/colorFor()
// (unified-grid-v2.html ~lines 4361-4482) almost verbatim, since that logic
// already works and react-leaflet's declarative model buys nothing here.
export function useLeafletMap({ containerId, cameras, sightings, active }: UseLeafletMapOptions) {
  const mapRef = useRef<L.Map | null>(null)
  const layerCamsRef = useRef<L.LayerGroup | null>(null)
  const layerRouteRef = useRef<L.LayerGroup | null>(null)

  // Sightings at cameras that haven't been geo-tagged yet carry null
  // lat/lon — skip them for the map (they still show in the timeline/
  // evidence strip, which don't need coordinates).
  const geoSightings = useMemo(
    () => sightings.filter((s): s is typeof s & { lat: number; lon: number } => s.lat !== null && s.lon !== null),
    [sightings],
  )
  const geoPoints = useMemo<[number, number][]>(
    () => geoSightings.map((s) => [s.lat, s.lon]),
    [geoSightings],
  )
  // Road-following path between the sightings, in order. Falls back to a
  // straight line (below) if OSRM's free demo server is unreachable — see
  // lib/routing.ts.
  const roadRoute = useRoadRoute(geoPoints)

  useEffect(() => {
    const map = L.map(containerId, { zoomControl: true, attributionControl: true }).setView([22.4, 71.6], 7)
    L.tileLayer(cartoTileUrl(), {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map)

    layerCamsRef.current = L.layerGroup().addTo(map)
    layerRouteRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerCamsRef.current = null
      layerRouteRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId])

  useEffect(() => {
    const layerCams = layerCamsRef.current
    if (!layerCams) return
    layerCams.clearLayers()
    const onRouteIds = new Set(sightings.map((s) => s.camera_id))
    for (const c of cameras) {
      if (typeof c.lat !== 'number' || typeof c.lon !== 'number') continue
      const onRoute = onRouteIds.has(c.id)
      const m = L.circleMarker([c.lat, c.lon], {
        radius: onRoute ? 6 : 4.5,
        color: '#0E1A24',
        weight: 1.4,
        fillColor: colorFor(c, onRouteIds),
        fillOpacity: 1,
      })
      m.bindPopup(buildPopupHtml(c))
      m.bindTooltip(c.name, { permanent: false, direction: 'right', offset: [7, 0], className: 'camlabel' })
      m.addTo(layerCams)
    }
  }, [cameras, sightings])

  useEffect(() => {
    const map = mapRef.current
    const layerRoute = layerRouteRef.current
    if (!map || !layerRoute) return
    layerRoute.clearLayers()
    if (geoSightings.length === 0) return

    // Road path when OSRM resolved one; otherwise connect the dots directly
    // so there's always a line, never a blank gap while it loads/fails.
    const linePts = roadRoute.data ?? geoPoints
    const routeLine = L.polyline(linePts, { color: '#4FC3D9', weight: 2.6, opacity: 0.95 }).addTo(layerRoute)

    geoSightings.forEach((s) => {
      const color = s.watchlist_flag ? '#E8A33D' : '#4FC3D9'
      L.circleMarker([s.lat, s.lon], {
        radius: 9,
        color,
        weight: 1.4,
        fill: false,
        opacity: s.watchlist_flag ? 0.9 : 0.45,
      }).addTo(layerRoute)
      L.marker([s.lat, s.lon], {
        icon: L.divIcon({
          className: '',
          html:
            `<div style="font-family:var(--mono);font-size:10px;color:${color};background:rgba(10,23,32,.85);` +
            `border:1px solid #23384A;border-radius:2px;padding:1px 5px;white-space:nowrap;transform:translate(10px,-22px)">` +
            `${s.seq}&nbsp;${escapeHtml(s.seen_time_str)}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(layerRoute)
    })

    map.fitBounds(routeLine.getBounds().pad(0.55))
  }, [geoSightings, geoPoints, roadRoute.data])

  useEffect(() => {
    if (!active || !mapRef.current) return
    const id = window.setTimeout(() => mapRef.current?.invalidateSize(), 80)
    return () => window.clearTimeout(id)
  }, [active])

  function focusOn(lat: number, lon: number, zoom = 13) {
    mapRef.current?.setView([lat, lon], zoom)
  }

  return { focusOn }
}
