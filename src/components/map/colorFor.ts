import type { Camera } from '../../types/domain'
import { mapColors } from '../../styles/tokens'

// Mirrors the Cameras registry panel's health pill (RegistryTable.tsx) so a
// camera reads the same status color on the map as it does in the table.
export const HEALTH_LABEL: Record<string, string> = { live: 'Live', deg: 'Degraded', rec: 'Reconnecting', down: 'Down' }

const HEALTH_COLOR: Record<string, string> = {
  live: mapColors.live,
  deg: mapColors.degraded,
  rec: mapColors.down,
  down: mapColors.down,
}

export function colorFor(c: Camera): string {
  const state = c.health?.state ?? 'live'
  return HEALTH_COLOR[state] ?? mapColors.live
}
