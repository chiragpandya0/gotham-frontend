import type { Camera } from '../../types/domain'

// Mirrors the Cameras registry panel's health pill (RegistryTable.tsx) so a
// camera reads the same status color on the map as it does in the table.
export const HEALTH_LABEL: Record<string, string> = { live: 'Live', deg: 'Degraded', rec: 'Reconnecting', down: 'Down' }

const HEALTH_COLOR: Record<string, string> = {
  live: '#4E9B6B', // --live
  deg: '#E8A33D', // --signal
  rec: '#E2685C', // --crit
  down: '#E2685C', // --crit
}

export function colorFor(c: Camera): string {
  const state = c.health?.state ?? 'live'
  return HEALTH_COLOR[state] ?? HEALTH_COLOR.live ?? '#4E9B6B'
}
