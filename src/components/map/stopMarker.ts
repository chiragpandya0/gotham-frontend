import L from 'leaflet'

// Numbered route stop: a ring with the stop's sequence number inside.
// Amber when the sighting carried a watchlist flag, cyan otherwise; the most
// recent stop is filled so it reads as "where it is now". Styled by .stopmark.
export function createStopMarker(
  lat: number,
  lon: number,
  seq: number,
  opts: { flagged: boolean; last: boolean },
): L.Marker {
  const cls = ['stopmark', opts.flagged ? 'flagged' : '', opts.last ? 'last' : ''].filter(Boolean).join(' ')
  return L.marker([lat, lon], {
    icon: L.divIcon({ className: cls, html: `<span>${seq}</span>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
    riseOnHover: true,
  })
}
