// The single place the API base URL lives. Only lib/apiClient.ts and
// lib/sse.ts should import this.
//
// Defaults to '' (relative) rather than a hardcoded host+port: the API is
// proxied through this same dev server (see vite.config.ts's server.proxy)
// so the browser only ever talks to ONE origin. A hardcoded cross-host
// default broke session auth (grid_session is SameSite=Lax, so it's only
// sent back when the page and the API are reached under the exact same
// host) and also breaks outright in port-forwarded remote dev environments
// where only the opened port resolves. Override via VITE_API_BASE_URL only
// for a real cross-origin deployment.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

// Free key from carto.com/basemaps/apikey — without it, tile requests get
// served an "API key required" watermark instead of the real basemap.
export const CARTO_API_KEY: string = import.meta.env.VITE_CARTO_API_KEY ?? ''
