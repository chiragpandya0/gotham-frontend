// Two sightings can land on the exact same camera coordinate (a route that
// passes the same camera twice). Stacking a marker/popup per sighting there
// makes only the top one hoverable — collapse to the latest (highest seq)
// at each coordinate before drawing markers. The route line/polyline should
// still walk every sighting, so this only touches marker rendering.
export function latestPerLocation<T extends { lat: number; lon: number; seq: number }>(items: T[]): T[] {
  const byKey = new Map<string, T>()
  for (const item of items) {
    const key = `${item.lat},${item.lon}`
    const existing = byKey.get(key)
    if (!existing || item.seq > existing.seq) byKey.set(key, item)
  }
  return Array.from(byKey.values())
}
