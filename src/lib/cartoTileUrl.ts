import { CARTO_API_KEY } from '../config/env'

// Centralizes the one place the CARTO tile URL is built, so the key only
// needs wiring in once. Without a key, CARTO serves an "API key required"
// watermark baked into the tile image itself instead of the real map.
export function cartoTileUrl(style: 'dark_all' = 'dark_all'): string {
  const base = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`
  return CARTO_API_KEY ? `${base}?key=${CARTO_API_KEY}` : base
}
