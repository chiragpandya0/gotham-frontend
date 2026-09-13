import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import type { TraceSighting } from '../../types/domain'
import { useRoadRoute } from '../../hooks/useRoadRoute'
import { cartoTileUrl } from '../../lib/cartoTileUrl'
import { buildSightingPopupHtml, bindSightingPopup } from '../map/sightingPopup'
import { latestPerLocation } from '../map/latestPerLocation'

interface TraceMapProps {
  sightings: TraceSighting[]
  active: boolean
}

// Ports initTraceMap() (unified-grid-v2.html ~line 6012) — a simpler,
// non-interactive companion map, distinct from the main map view's.
export function TraceMap({ sightings, active }: TraceMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  const geoSightings = useMemo(
    () => sightings.filter((s): s is typeof s & { lat: number; lon: number } => s.lat !== null && s.lon !== null),
    [sightings],
  )
  const geoPoints = useMemo<[number, number][]>(() => geoSightings.map((s) => [s.lat, s.lon]), [geoSightings])
  const markerSightings = useMemo(() => latestPerLocation(geoSightings), [geoSightings])
  const roadRoute = useRoadRoute(geoPoints)

  useEffect(() => {
    const map = L.map('tmap', {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView([22, 70.7], 8)
    L.tileLayer(cartoTileUrl(), {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      // See AlertLocationMiniMap for why map.stop() has to run first.
      map.stop()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (geoSightings.length === 0) return

    const linePts = roadRoute.data ?? geoPoints
    const line = L.polyline(linePts, { color: '#4FC3D9', weight: 2.4, opacity: 0.95 }).addTo(layer)

    markerSightings.forEach((s) => {
      const marker = L.circleMarker([s.lat, s.lon], {
        radius: 5,
        color: '#0E1A24',
        weight: 1.3,
        fillColor: s.watchlist_flag ? '#E8A33D' : '#4FC3D9',
        fillOpacity: 1,
      }).addTo(layer)
      bindSightingPopup(marker, buildSightingPopupHtml(s, { showSeq: true }))
    })

    const id = window.setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(line.getBounds().pad(0.35))
    }, 60)
    return () => window.clearTimeout(id)
  }, [geoSightings, geoPoints, markerSightings, roadRoute.data])

  useEffect(() => {
    if (!active || !mapRef.current) return
    const id = window.setTimeout(() => mapRef.current?.invalidateSize(), 80)
    return () => window.clearTimeout(id)
  }, [active])

  return <div id="tmap" />
}
