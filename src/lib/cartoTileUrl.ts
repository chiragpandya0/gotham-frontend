import { CARTO_API_KEY } from '../config/env'

export type CartoStyle = 'dark' | 'light' | 'voyager' | 'osm'

const STYLE_PATH: Record<CartoStyle, string> = {
  dark: 'dark_all',
  light: 'light_all',
  voyager: 'rastertiles/voyager',
  osm: '',
}

// Centralizes the one place the CARTO tile URL is built, so the key only
// needs wiring in once. Without a key, CARTO serves an "API key required"
// watermark baked into the tile image itself instead of the real map.
export function cartoTileUrl(style: CartoStyle = 'dark'): string {
  // Standard OpenStreetMap tiles (not CARTO) — no key, no subdomains.
  if (style === 'osm') return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  const base = `https://{s}.basemaps.cartocdn.com/${STYLE_PATH[style]}/{z}/{x}/{y}{r}.png`
  return CARTO_API_KEY ? `${base}?key=${CARTO_API_KEY}` : base
}
