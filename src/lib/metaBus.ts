import type { Meta } from '../types/api'

// Drives the footer query bar, which always reflects the most recent
// successful operation app-wide (not just the active view) — mirrors the
// mockup's shared #sql/#ms spans without threading `meta` through every
// component by hand.
type Listener = (meta: Meta) => void

const listeners = new Set<Listener>()
let latest: Meta | null = null

export const metaBus = {
  emit(meta: Meta) {
    latest = meta
    for (const listener of listeners) listener(meta)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getLatest(): Meta | null {
    return latest
  },
}
