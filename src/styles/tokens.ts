// Colors that JavaScript needs (Leaflet draws on canvas/SVG attributes, which
// can't take CSS variables). Keep in sync with tokens.css.
export const mapColors = {
  ring: '#0b0e11', // --bg-0, separates markers from the map
  live: '#32a467', // --green-b
  degraded: '#ec9a3c', // --amber-b
  down: '#e76a6e', // --red-b
  route: '#3dcce0', // --cyan-b
  routeEnd: '#ffffff',
  flagged: '#ec9a3c', // --amber-b
  critical: '#e76a6e', // --red-b
} as const
