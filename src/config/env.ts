// The single place the API base URL lives. Only lib/apiClient.ts, lib/sse.ts
// and lib/postSse.ts should import this.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Free key from carto.com/basemaps/apikey — without it, tile requests get
// served an "API key required" watermark instead of the real basemap.
export const CARTO_API_KEY: string = import.meta.env.VITE_CARTO_API_KEY ?? ''
