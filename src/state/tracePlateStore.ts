import type { PlateQuery } from '../types/domain'

// The vehicle currently being traced — shared between the top bar's search
// box, the Map view's route overlay, and the Trace view, mirroring the
// mockup's single #q input driving all three.
//
// Two ways in: a typed plate (top bar search, Alert/Vehicles rows that only
// ever have a formatted plate string to work with) or a specific detection's
// id (raw-reads rows, and plate-type alerts — both know the exact
// plate_sighting.id behind them, which GET /api/trace/{detection_id} can
// resolve directly instead of re-deriving a track from a re-parsed plate
// string).
export type TraceTarget = { kind: 'plate'; plate: PlateQuery } | { kind: 'detection'; detectionId: number }

type Listener = (target: TraceTarget) => void

const listeners = new Set<Listener>()
let target: TraceTarget = { kind: 'plate', plate: { plate_type: 'STANDARD_STATE' } }

export const tracePlateStore = {
  setPlate(plate: PlateQuery) {
    target = { kind: 'plate', plate }
    for (const l of listeners) l(target)
  },
  setDetection(detectionId: number) {
    target = { kind: 'detection', detectionId }
    for (const l of listeners) l(target)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): TraceTarget {
    return target
  },
}
