import type { PlateQuery, PlateType } from '../types/domain'

// Formatted plate displays are always STATE-RTO-SERIES-NUMBER (state/rto show as
// "??" when the OCR couldn't resolve them) — there's no per-row plate_type in the
// detections/vehicles responses, so a plate traced from a table row is assumed
// STANDARD_STATE; BH-series plates aren't part of the current seed data. Also
// accepts space-separated input, for the top bar's free-text quick search.
export function parsePlateDisplay(display: string): PlateQuery {
  const parts = display
    .split(/[\s-]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 4) {
    const [state, rto, series, number] = parts
    return {
      plate_type: 'STANDARD_STATE',
      state_code: state === '??' ? undefined : state,
      rto_code: rto === '??' ? undefined : rto,
      series: series === '??' ? undefined : series,
      number: number === '??' ? undefined : number,
    }
  }
  return { plate_type: 'STANDARD_STATE', number: display }
}

// Reconstructs segments from a formatted display string when the plate_type is
// already known (e.g. a watchlist entry, which returns plate_display + plate_type
// but not the individual segment columns). Formatted plates are always complete
// (no "??"), unlike an OCR read's plate_display.
export function parseFormattedPlate(display: string, plateType: PlateType): PlateQuery {
  const parts = display.split('-').map((p) => p.trim())
  if (plateType === 'BH_SERIES' && parts.length === 4) {
    const [year, , number, series] = parts
    return { plate_type: 'BH_SERIES', year_code: year, number, series }
  }
  if (plateType === 'STANDARD_STATE' && parts.length === 4) {
    const [state, rto, series, number] = parts
    return { plate_type: 'STANDARD_STATE', state_code: state, rto_code: rto, series, number }
  }
  if (plateType === 'STANDARD_STATE' && parts.length === 3) {
    const [state, rto, number] = parts
    return { plate_type: 'STANDARD_STATE', state_code: state, rto_code: rto, number }
  }
  return { plate_type: plateType }
}

export function formatPlateQuery(q: PlateQuery): string {
  if (q.plate_type === 'BH_SERIES') {
    return [q.year_code, 'BH', q.number, q.series].filter(Boolean).join(' ')
  }
  return [q.state_code, q.rto_code, q.series, q.number].filter(Boolean).join(' ')
}

export function isPlateQueryEmpty(q: PlateQuery): boolean {
  return !q.state_code && !q.rto_code && !q.year_code && !q.series && !q.number
}
