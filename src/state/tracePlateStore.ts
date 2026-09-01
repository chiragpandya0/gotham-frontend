// The plate currently being traced — shared between the top bar's search
// box, the Map view's route overlay, and the Trace view, mirroring the
// mockup's single #q input driving all three.
type Listener = (plate: string) => void

const listeners = new Set<Listener>()
let plate = 'GJ 11 AB 4517' // the one fully-fleshed-out demo path per FRONTEND_INTEGRATION.md

export const tracePlateStore = {
  set(next: string) {
    plate = next
    for (const l of listeners) l(plate)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): string {
    return plate
  },
}
