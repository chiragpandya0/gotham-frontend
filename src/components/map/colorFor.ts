import type { Camera } from '../../types/domain'

// Ported from the mockup's colorFor() (unified-grid-v2.html ~line 4361). The
// codec-based palette (purple/blue-gray/slate) reads fine on the light
// voyager/light basemaps but nearly disappears on the dark one, so dark mode
// drops the codec coloring and goes plain white instead.
export function colorFor(c: Camera, dark: boolean): string {
  if (dark) return '#FFFFFF'
  if (c.codec === 'hevc') return '#B08BC9'
  if (c.codec) return '#7FA7BC'
  return '#4C6474'
}
