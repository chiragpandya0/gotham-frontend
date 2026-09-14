import type { PlateQuery } from '../types/domain'

// The plate currently being traced — shared between the top bar's search
// box, the Map view's route overlay, and the Trace view, mirroring the
// mockup's single #q input driving all three.
type Listener = (plate: PlateQuery) => void

const listeners = new Set<Listener>()
let plate: PlateQuery = { plate_type: 'STANDARD_STATE' }

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
