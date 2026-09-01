import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { cartoTileUrl } from '../../lib/cartoTileUrl'

interface AlertLocationMiniMapProps {
  lat: number
  lon: number
  critical: boolean
}

// Ports initDetailMap() (unified-grid-v2.html ~line 4687).
export function AlertLocationMiniMap({ lat, lon, critical }: AlertLocationMiniMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    const map = L.map('dmap', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
    }).setView([lat, lon], 13)
    L.tileLayer(cartoTileUrl(), {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)
    markerRef.current = L.circleMarker([lat, lon], {
      radius: 7,
      color: '#0E1A24',
      weight: 1.5,
      fillColor: critical ? '#E2685C' : '#E8A33D',
      fillOpacity: 1,
    }).addTo(map)
    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 60)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    mapRef.current.setView([lat, lon], 13)
    markerRef.current.setLatLng([lat, lon]).setStyle({ fillColor: critical ? '#E2685C' : '#E8A33D' })
  }, [lat, lon, critical])

  return <div id="dmap" />
}
