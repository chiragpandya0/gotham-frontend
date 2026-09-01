import type { Camera } from '../../types/domain'

// Ported verbatim from the mockup's colorFor() (unified-grid-v2.html ~line 4361).
export function colorFor(c: Camera, onRouteIds: ReadonlySet<number>): string {
  if (onRouteIds.has(c.id)) return '#4FC3D9'
  if (c.codec === 'hevc') return '#B08BC9'
  if (c.codec) return '#7FA7BC'
  return '#4C6474'
}
