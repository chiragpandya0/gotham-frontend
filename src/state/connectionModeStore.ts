// 'sse' | 'polling' — flipped by useLiveChannel (phase 6) after two failed
// SSE connection attempts. Starts 'sse' optimistically; the shell shows no
// live indicator until the channel actually connects or falls back.
export type ConnectionMode = 'connecting' | 'sse' | 'polling'

type Listener = (mode: ConnectionMode) => void

const listeners = new Set<Listener>()
let mode: ConnectionMode = 'connecting'

export const connectionModeStore = {
  set(next: ConnectionMode) {
    mode = next
    for (const listener of listeners) listener(mode)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): ConnectionMode {
    return mode
  },
}
