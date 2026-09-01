// The alert currently shown in the Alerts view detail pane — shared between
// the queue list, the sidebar's watchlist mini-feed, and (eventually) an
// alert-raised toast, mirroring tracePlateStore's pattern.
type Listener = (id: number | null) => void

const listeners = new Set<Listener>()
let selectedId: number | null = null

export const selectedAlertStore = {
  set(id: number | null) {
    selectedId = id
    for (const l of listeners) l(selectedId)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): number | null {
    return selectedId
  },
}
