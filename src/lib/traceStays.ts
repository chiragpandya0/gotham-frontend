import type { TraceLeg, TraceSighting } from '../types/domain'

// A vehicle parked in view of one camera is re-read every few minutes, which
// shows up as a run of consecutive same-camera legs/sightings. These helpers
// fold such runs (two or more) into a single "stay"; a lone repeat is left
// flat and moves between different cameras are never grouped.

export function isRevisitLeg(leg: TraceLeg): boolean {
  if (leg.from_camera_id != null && leg.to_camera_id != null) return leg.from_camera_id === leg.to_camera_id
  return leg.kind === 'revisit'
}

export interface IndexedLeg {
  leg: TraceLeg
  index: number
}

export type LegRow =
  | { type: 'leg'; item: IndexedLeg }
  | { type: 'stay'; label: string; first: IndexedLeg; last: IndexedLeg; items: IndexedLeg[]; dwell_s: number }

export function groupLegStays(legs: TraceLeg[]): LegRow[] {
  const rows: LegRow[] = []
  let run: IndexedLeg[] = []
  const flush = () => {
    const first = run[0]
    const last = run[run.length - 1]
    if (first && last && run.length >= 2) {
      rows.push({ type: 'stay', label: first.leg.to_label, first, last, items: run, dwell_s: run.reduce((t, r) => t + r.leg.gap_s, 0) })
    } else {
      run.forEach((item) => rows.push({ type: 'leg', item }))
    }
    run = []
  }
  legs.forEach((leg, index) => {
    if (isRevisitLeg(leg)) {
      run.push({ leg, index })
    } else {
      flush()
      rows.push({ type: 'leg', item: { leg, index } })
    }
  })
  flush()
  return rows
}

export type SightingRow =
  | { type: 'single'; sighting: TraceSighting }
  | { type: 'stay'; first: TraceSighting; last: TraceSighting; sightings: TraceSighting[]; dwell_s: number }

// Consecutive sightings at the same camera (chronological order in, same order out).
export function groupSightingStays(sightings: TraceSighting[]): SightingRow[] {
  const rows: SightingRow[] = []
  let run: TraceSighting[] = []
  const flush = () => {
    const first = run[0]
    const last = run[run.length - 1]
    if (first && last && run.length >= 2) {
      const dwell = (Date.parse(last.seen_at) - Date.parse(first.seen_at)) / 1000
      rows.push({ type: 'stay', first, last, sightings: run, dwell_s: Number.isFinite(dwell) ? Math.max(0, dwell) : 0 })
    } else {
      run.forEach((sighting) => rows.push({ type: 'single', sighting }))
    }
    run = []
  }
  for (const s of sightings) {
    const prev = run[run.length - 1]
    if (prev && prev.camera_id !== s.camera_id) flush()
    run.push(s)
  }
  flush()
  return rows
}

// Matches the backend's gap_str style: "3 h 48 min" / "45 min 21 s" / "40 s".
export function formatDwell(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return sec > 0 ? `${m} min ${sec} s` : `${m} min`
  return `${sec} s`
}
