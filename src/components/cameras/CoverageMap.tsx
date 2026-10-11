import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useCameras } from '../../hooks/useCameras'
import { useCoverageMap } from '../../hooks/useCoverageMap'
import { colorFor } from '../map/colorFor'
import { cartoTileUrl } from '../../lib/cartoTileUrl'
import { coverageColors, mapColors } from '../../styles/tokens'
import type { CoverageDistrict, CoverageStatus } from '../../types/domain'

export const STATUS_LABEL: Record<CoverageStatus, string> = {
  no_coverage: 'No coverage',
  neighbour_only: 'Reached from a neighbour only',
  single_camera: 'Single camera',
  multi_camera: 'Two or more cameras',
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function districtTooltip(d: CoverageDistrict): string {
  const cams =
    d.cameras === 0 ? 'no cameras of its own' : `${d.cameras} camera${d.cameras === 1 ? '' : 's'} (${d.cameras_live} live)`
  return `<b>${escapeHtml(d.name)}</b><br>${STATUS_LABEL[d.status]}<br>${cams}<br>${d.coverage_pct}% of area covered`
}

// Gap-analysis picture: every district filled by how well it is covered, the
// actual reach of the cameras (union of their coverage circles) drawn over it,
// and the cameras themselves. Mount it only while it is visible (the drawer
// does), so Leaflet always measures a real container.
export function CoverageMap() {
  const { data: map } = useCoverageMap()
  const { data: cameras } = useCameras({ geo: true })
  const containerRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const m = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([22.4, 71.6], 6)
    L.tileLayer(cartoTileUrl('osm'), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    layersRef.current = L.layerGroup().addTo(m)
    leafletRef.current = m
    const resizeObserver = new ResizeObserver(() => m.invalidateSize())
    resizeObserver.observe(m.getContainer())
    return () => {
      resizeObserver.disconnect()
      m.stop()
      m.remove()
      leafletRef.current = null
      layersRef.current = null
    }
  }, [])

  useEffect(() => {
    const m = leafletRef.current
    const layers = layersRef.current
    if (!m || !layers || !map) return
    layers.clearLayers()

    const districts = L.geoJSON(map.districts, {
      style: (f) => {
        const status = f?.properties?.status as CoverageStatus | undefined
        const color = status ? coverageColors[status] : '#888'
        return { color, weight: 1, opacity: 0.9, fillColor: color, fillOpacity: status === 'no_coverage' ? 0.28 : 0.22 }
      },
      onEachFeature: (f, layer) => {
        if (f.properties.status) layer.bindTooltip(districtTooltip(f.properties), { sticky: true })
      },
    }).addTo(layers)

    if (map.reach) {
      L.geoJSON(map.reach, {
        style: { color: mapColors.live, weight: 1, opacity: 0.9, fillColor: mapColors.live, fillOpacity: 0.35 },
        interactive: false,
      }).addTo(layers)
    }

    for (const c of cameras?.cameras ?? []) {
      if (typeof c.lat !== 'number' || typeof c.lon !== 'number') continue
      L.circleMarker([c.lat, c.lon], { radius: 4, stroke: true, color: mapColors.ring, weight: 1, fillColor: colorFor(c), fillOpacity: 1 })
        .bindTooltip(c.name, { direction: 'right', offset: [6, 0] })
        .addTo(layers)
    }

    m.fitBounds(districts.getBounds(), { padding: [8, 8] })
  }, [map, cameras])

  return (
    <div className="covmap">
      <div ref={containerRef} className="covmap-canvas" />
      <div className="covmap-legend">
        {(Object.keys(STATUS_LABEL) as CoverageStatus[]).map((s) => (
          <span key={s}>
            <i style={{ background: coverageColors[s] }} />
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span>
          <i style={{ background: mapColors.live, opacity: 0.6 }} />
          Camera reach{map ? ` (${map.radius_m / 1000} km)` : ''}
        </span>
      </div>
    </div>
  )
}
