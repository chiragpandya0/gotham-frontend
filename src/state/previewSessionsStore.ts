// Client-only runtime state — API.md's "Not endpoints" table confirms the
// 4-concurrent-session cap is enforced in the browser, not the backend.
export const MAX_PREVIEW_SESSIONS = 4

type Listener = (open: ReadonlySet<number>) => void

const listeners = new Set<Listener>()
let open = new Set<number>()

export const previewSessionsStore = {
  canOpen(cameraId: number): boolean {
    return open.has(cameraId) || open.size < MAX_PREVIEW_SESSIONS
  },
  start(cameraId: number) {
    if (!this.canOpen(cameraId)) return false
    open = new Set(open).add(cameraId)
    for (const l of listeners) l(open)
    return true
  },
  stop(cameraId: number) {
    if (!open.has(cameraId)) return
    const next = new Set(open)
    next.delete(cameraId)
    open = next
    for (const l of listeners) l(open)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): ReadonlySet<number> {
    return open
  },
}
