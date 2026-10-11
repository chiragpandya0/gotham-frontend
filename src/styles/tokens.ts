// Colors that JavaScript needs (Leaflet draws on canvas/SVG attributes, which
// can't take CSS variables). Keep in sync with tokens.css.
export const mapColors = {
  ring: '#0b0e11', // --bg-0, separates markers from the map
  live: '#32a467', // --green-b
  degraded: '#ec9a3c', // --amber-b
  down: '#e76a6e', // --red-b
  route: '#3dcce0', // --cyan-b
  flagged: '#ec9a3c', // --amber-b
  critical: '#e76a6e', // --red-b
} as const

// Gap-analysis district fills, worst to best. Same hues as the health colors above:
// red = nothing reaches it, amber = only a neighbour's camera does, cyan = one camera, green = two or more.
export const coverageColors = {
  no_coverage: mapColors.down,
  neighbour_only: mapColors.degraded,
  single_camera: mapColors.route,
  multi_camera: mapColors.live,
} as const
