import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import type { Camera, TraceSighting } from '../../types/domain'
import { colorFor, HEALTH_LABEL } from './colorFor'
import { useRoadRoute } from '../../hooks/useRoadRoute'
import { cartoTileUrl, type CartoStyle } from '../../lib/cartoTileUrl'
import { createMapStyleControl } from './mapStyleControl'
import { buildSightingPopupHtml, bindSightingPopup } from './sightingPopup'
import { latestPerLocation } from './latestPerLocation'
import { createStopMarker } from './stopMarker'
import { mapColors } from '../../styles/tokens'

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
  const measuredOrDeclared = c.measured_fps ?? c.declared_fps
  const fps = measuredOrDeclared ? `${measuredOrDeclared} fps` : 'not reported'
  const healthState = c.health?.state ?? 'live'
  const healthLabel = HEALTH_LABEL[healthState] ?? healthState
  const tone = healthState === 'live' ? 'ok' : healthState === 'deg' ? 'warn' : 'bad'
  const where = [c.district, c.department].filter(Boolean).map((v) => escapeHtml(String(v))).join(' · ')
  const coords =
    typeof c.lat === 'number' && typeof c.lon === 'number' ? ` · ${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}` : ''
  const warn = c.codec ? '' : `<div class="campop-warn">Stream properties unknown. Probe before batching inference.</div>`
  return (
    `<div class="campop">` +
    `<div class="campop-head"><b>${escapeHtml(c.display_label ?? c.name)}</b>` +
    `<span class="campop-chip ${tone}">${escapeHtml(healthLabel)}</span></div>` +
    `<div class="campop-sub">${where}</div>` +
    `<div class="campop-id">CAM-${String(c.id).padStart(4, '0')}${coords}</div>` +
    `<dl class="campop-kv"><dt>Codec</dt><dd>${codec}</dd><dt>Resolution</dt><dd>${res}</dd><dt>Frame rate</dt><dd>${fps}</dd></dl>` +
    warn +
    `</div>`
  )
}

interface UseLeafletMapOptions {
  containerId: string
  cameras: Camera[]
  sightings: TraceSighting[]
  /** Whether the containing view is currently visible — drives invalidateSize(). */
  active: boolean
  /** Which of the two overlay layers are shown — the "Cameras"/"Route" chips. */
  layersOn: { cams: boolean; route: boolean }
  /** Coordinates of the route stop picked in the ledger; its marker gets a highlight ring. */
  selectedLocation?: [number, number] | null
}

// Thin imperative wrapper porting the mockup's initMap()/drawRoute()/colorFor()
// (unified-grid-v2.html ~lines 4361-4482) almost verbatim, since that logic
// already works and react-leaflet's declarative model buys nothing here.
export function useLeafletMap({ containerId, cameras, sightings, active, layersOn, selectedLocation }: UseLeafletMapOptions) {
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const layerCamsRef = useRef<L.LayerGroup | null>(null)
  const layerRouteRef = useRef<L.LayerGroup | null>(null)
  // Route stop markers keyed by "lat,lon" so the ledger selection can highlight one.
  const stopMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  // The route's bounds, remembered so they can be re-applied once the view
  // becomes visible again — fitBounds() on a hidden (0x0) container computes
  // a bogus world-spanning zoom that invalidateSize() alone won't correct.
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null)
  // A pending "focus these cameras" request (from the Cameras registry's
  // "View on map"/row "Map" buttons) — same hidden-container problem as
  // routeBoundsRef above, so it's applied the same way, from the same
  // active-driven effect below.
  const cameraFocusRef = useRef<{ bounds: L.LatLngBounds } | { point: [number, number]; zoom: number } | null>(null)
  const [mapStyle, setMapStyle] = useState<CartoStyle>('osm')

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
  const markerSightings = useMemo(() => latestPerLocation(geoSightings), [geoSightings])
  // Road-following path between the sightings, in order. Falls back to a
  // straight line (below) if OSRM's free demo server is unreachable — see
  // lib/routing.ts.
  const roadRoute = useRoadRoute(geoPoints)

  useEffect(() => {
    const map = L.map(containerId, { zoomControl: true, attributionControl: true }).setView([22.4, 71.6], 7)
    tileLayerRef.current = L.tileLayer(cartoTileUrl('osm'), {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map)
    createMapStyleControl('osm', (style) => {
      tileLayerRef.current?.setUrl(cartoTileUrl(style))
      setMapStyle(style)
    }).addTo(map)

    layerCamsRef.current = L.layerGroup().addTo(map)
    layerRouteRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    // The map's own container can resize without the "active" view changing
    // underneath it — e.g. the sidebar collapsing/expanding. Leaflet doesn't
    // pick that up on its own, so watch the container directly and re-fit.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(map.getContainer())

    return () => {
      resizeObserver.disconnect()
      // See AlertLocationMiniMap for why map.stop() has to run first.
      map.stop()
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      layerCamsRef.current = null
      layerRouteRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId])

  useEffect(() => {
    const layerCams = layerCamsRef.current
    if (!layerCams) return
    layerCams.clearLayers()
    for (const c of cameras) {
      if (typeof c.lat !== 'number' || typeof c.lon !== 'number') continue
      const m = L.circleMarker([c.lat, c.lon], {
        radius: 6,
        stroke: false,
        fillColor: colorFor(c),
        fillOpacity: 1,
        className: 'cammark',
      })
      m.bindPopup(buildPopupHtml(c))
      // The open popup marks the selected camera: a thin dark outline while it is open.
      m.on('popupopen', () => m.setStyle({ stroke: true, color: mapColors.ring, weight: 1.5, opacity: 1 }))
      m.on('popupclose', () => m.setStyle({ stroke: false }))
      m.bindTooltip(c.name, { permanent: false, direction: 'right', offset: [7, 0], className: 'camlabel' })
      m.addTo(layerCams)
    }
  }, [cameras])

  // The "Cameras"/"Route" chips are a simple either/or switch between the
  // two overlays rather than independent toggles — showing all onboarded
  // cameras and the traced route's own markers at once was cluttering the
  // map, so picking one hides the other.
  useEffect(() => {
    const map = mapRef.current
    const layerCams = layerCamsRef.current
    if (!map || !layerCams) return
    if (layersOn.cams) {
      if (!map.hasLayer(layerCams)) layerCams.addTo(map)
    } else if (map.hasLayer(layerCams)) {
      map.removeLayer(layerCams)
    }
  }, [layersOn.cams])

  useEffect(() => {
    const map = mapRef.current
    const layerRoute = layerRouteRef.current
    if (!map || !layerRoute) return
    if (layersOn.route) {
      if (!map.hasLayer(layerRoute)) layerRoute.addTo(map)
    } else if (map.hasLayer(layerRoute)) {
      map.removeLayer(layerRoute)
    }
  }, [layersOn.route])

  useEffect(() => {
    const map = mapRef.current
    const layerRoute = layerRouteRef.current
    if (!map || !layerRoute) return
    layerRoute.clearLayers()
    stopMarkersRef.current.clear()
    if (geoSightings.length === 0) return

    // Road path when OSRM resolved one; otherwise connect the dots directly
    // so there's always a line, never a blank gap while it loads/fails.
    const linePts = roadRoute.data ?? geoPoints
    const routeLine = L.polyline(linePts, { color: mapColors.route, weight: 2.5, opacity: 1, lineJoin: 'round' }).addTo(layerRoute)

    const lastSeq = Math.max(...markerSightings.map((m) => m.seq))
    markerSightings.forEach((s) => {
      const ring = createStopMarker(s.lat, s.lon, s.seq, { flagged: !!s.watchlist_flag, last: s.seq === lastSeq }).addTo(
        layerRoute,
      )
      stopMarkersRef.current.set(`${s.lat},${s.lon}`, ring)
      bindSightingPopup(ring, buildSightingPopupHtml(s))
    })

    const bounds = routeLine.getBounds().pad(0.55)
    routeBoundsRef.current = bounds
    // fitBounds() while the view is hidden sees a 0x0 container and snaps to
    // a bogus world zoom; only apply it live, and let the active-effect
    // below re-apply the remembered bounds once the view is visible again.
    if (active) map.fitBounds(bounds)
  }, [geoSightings, geoPoints, markerSightings, roadRoute.data, active])

  // Ring the marker of the stop selected in the ledger (and clear it from the others).
  useEffect(() => {
    const key = selectedLocation ? `${selectedLocation[0]},${selectedLocation[1]}` : null
    stopMarkersRef.current.forEach((marker, k) => {
      marker.getElement()?.classList.toggle('selected', k === key)
    })
  }, [selectedLocation, geoSightings, markerSightings, roadRoute.data, layersOn.route])

  useEffect(() => {
    if (!active || !mapRef.current) return
    const map = mapRef.current
    const id = window.setTimeout(() => {
      map.invalidateSize()
      if (cameraFocusRef.current) applyPendingCameraFocus()
      else if (routeBoundsRef.current) map.fitBounds(routeBoundsRef.current)
    }, 80)
    return () => window.clearTimeout(id)
  }, [active])

  function applyPendingCameraFocus() {
    const map = mapRef.current
    const pending = cameraFocusRef.current
    if (!map || !pending) return
    if ('bounds' in pending) map.fitBounds(pending.bounds)
    else map.setView(pending.point, pending.zoom)
    cameraFocusRef.current = null
  }

  // Frames one or more cameras on the map — a single match gets a close
  // zoom, multiple matches get a bounds fit. Cameras without coordinates are
  // silently skipped (same as the marker-drawing effect above).
  //
  // This only ever stores the request; it never applies it immediately, even
  // if the view already looks "active" this render. The caller (Cameras
  // registry) always flips the view to Map in the same tick as this call, so
  // by React's own bookkeeping `active` is transitioning false -> true this
  // commit — which the [active] effect above is about to react to anyway.
  // Calling fitBounds() here first would measure the container before that
  // transition has actually painted/laid out, which for a multi-camera
  // bounds fit (unlike a fixed-zoom setView) reads a 0x0 box and snaps to a
  // bogus whole-world zoom. Leaving it to that effect's deferred timeout
  // guarantees a real layout pass has happened first.
  function focusCameras(ids: number[]) {
    const matches = cameras.filter(
      (c): c is Camera & { lat: number; lon: number } =>
        ids.includes(c.id) && typeof c.lat === 'number' && typeof c.lon === 'number',
    )
    if (matches.length === 0) return
    const first = matches[0]
    cameraFocusRef.current =
      matches.length === 1 && first
        ? { point: [first.lat, first.lon], zoom: 15 }
        : { bounds: L.latLngBounds(matches.map((c): [number, number] => [c.lat, c.lon])).pad(0.35) }
  }

  function focusOn(lat: number, lon: number, zoom = 13) {
    mapRef.current?.setView([lat, lon], zoom)
  }

  // Zooms back out to the whole traced route (the same framing it gets on load).
  function fitRoute() {
    if (routeBoundsRef.current) mapRef.current?.fitBounds(routeBoundsRef.current)
  }

  return { focusOn, focusCameras, fitRoute, mapStyle }
}
