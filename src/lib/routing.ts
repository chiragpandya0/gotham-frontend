const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

// Public demo server run by FOSSGIS — free, no key, no signup, but no SLA
// either. Fine for a low-traffic ops dashboard; callers should fall back to
// a straight line on failure rather than show nothing (see useLeafletMap.ts
// and TraceMap.tsx).
export async function fetchRoadRoute(points: [number, number][]): Promise<[number, number][]> {
  if (points.length < 2) return points

  const coordStr = points.map(([lat, lon]) => `${lon},${lat}`).join(';')
  const res = await fetch(`${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`)
  if (!res.ok) throw new Error(`OSRM routing failed: ${res.status}`)

  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No road route found between these points')

  // GeoJSON coordinates are [lon, lat] — Leaflet wants [lat, lon].
  return (data.routes[0].geometry.coordinates as [number, number][]).map(([lon, lat]) => [lat, lon])
}
