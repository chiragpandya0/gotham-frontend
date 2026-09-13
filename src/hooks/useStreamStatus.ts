import { useEffect, useState, useSyncExternalStore } from 'react'
import { streamStore } from '../state/streamStore'

export type StreamStatus = 'live' | 'idle' | 'reconnecting'

export interface StreamStatusInfo {
  status: StreamStatus
  label: string
}

// No event of any kind (not even a heartbeat comment — those aren't
// observable from JS) for this long while otherwise connected: flag it as
// idle rather than claim "Live" with no evidence. This can be a genuine
// quiet period, not necessarily a dead connection — see streamStore's note
// on why that ambiguity can't be fully resolved client-side.
const IDLE_AFTER_MS = 90_000
const TICK_MS = 15_000

function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'under 1m'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h`
}

export function useStreamStatus(): StreamStatusInfo {
  const readyState = useSyncExternalStore(streamStore.subscribeStatus, streamStore.getReadyState, streamStore.getReadyState)
  const lastEventAt = useSyncExternalStore(streamStore.subscribeStatus, streamStore.getLastEventAt, streamStore.getLastEventAt)

  // Recomputing "no updates in Xm" needs a clock tick independent of any
  // store change — nothing else fires while the stream stays quiet.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  if (readyState !== EventSource.OPEN) {
    return { status: 'reconnecting', label: 'Reconnecting…' }
  }
  if (lastEventAt !== null && now - lastEventAt >= IDLE_AFTER_MS) {
    return { status: 'idle', label: `No updates in ${formatElapsed(now - lastEventAt)}` }
  }
  return { status: 'live', label: 'Live' }
}
