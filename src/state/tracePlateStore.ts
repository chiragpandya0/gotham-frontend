import type { PlateQuery } from '../types/domain'

// The plate currently being traced — shared between the top bar's search
// box, the Map view's route overlay, and the Trace view, mirroring the
// mockup's single #q input driving all three.
type Listener = (plate: PlateQuery) => void

const listeners = new Set<Listener>()
// FRONTEND_INTEGRATION.md's demo path (GJ 11 AB 4517) no longer exists in the
// current seed data — GJ-11-CL-7437 is a real multi-camera, watchlisted vehicle.
let plate: PlateQuery = { plate_type: 'STANDARD_STATE', state_code: 'GJ', rto_code: '11', series: 'CL', number: '7437' }

export const tracePlateStore = {
  set(next: PlateQuery) {
    plate = next
    for (const l of listeners) l(plate)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): PlateQuery {
    return plate
  },
}
