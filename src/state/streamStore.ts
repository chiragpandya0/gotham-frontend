import { API_BASE_URL } from '../config/env'
import type { StreamAlertEvent, StreamCameraHealthEvent, StreamDetectionEvent } from '../types/domain'

// GET /api/stream — one long-lived, cookie-authed SSE connection shared by
// every live feature (live detections, live alerts, camera health). All
// three event types ride this single connection, so this store owns exactly
// one EventSource and fans events out to subscribers, rather than each
// feature opening its own stream.
//
// Not enveloped like the rest of the API: raw `event:`/`data:` lines, no
// {data, meta} wrapper. `retry: 5000` (reconnect delay) and the `: heartbeat`
// idle comment are both handled natively by EventSource — nothing to do
// here for either.

interface StreamEventMap {
  detection: StreamDetectionEvent
  alert: StreamAlertEvent
  camera_health: StreamCameraHealthEvent
}

type StreamEventName = keyof StreamEventMap
type Listener<K extends StreamEventName> = (payload: StreamEventMap[K]) => void
type ReconnectListener = () => void
type StatusListener = () => void

const listeners: { [K in StreamEventName]: Set<Listener<K>> } = {
  detection: new Set(),
  alert: new Set(),
  camera_health: new Set(),
}
const reconnectListeners = new Set<ReconnectListener>()
const statusListeners = new Set<StatusListener>()

let es: EventSource | null = null
let sawErrorSinceOpen = false
let hasOpenedBefore = false
// Timestamp of the most recently received event of ANY kind — drives the
// connection-health indicator's "no updates in Xm" state. Heartbeats
// (`: heartbeat` SSE comments) aren't observable from JS at all, so this is
// the only recency signal the UI can show; it can legitimately go quiet
// during a real lull in backend activity, not just a dead connection —
// that ambiguity is inherent to the API, not a frontend gap.
let lastEventAt: number | null = null

function notifyStatus() {
  for (const l of statusListeners) l()
}

function handleEvent<K extends StreamEventName>(name: K) {
  return (e: MessageEvent) => {
    let payload: StreamEventMap[K]
    try {
      payload = JSON.parse(e.data)
    } catch {
      return
    }
    lastEventAt = Date.now()
    notifyStatus()
    for (const l of listeners[name]) l(payload)
  }
}

function connect() {
  if (es) return
  es = new EventSource(`${API_BASE_URL}/api/stream`, { withCredentials: true })

  es.addEventListener('detection', handleEvent('detection'))
  es.addEventListener('alert', handleEvent('alert'))
  es.addEventListener('camera_health', handleEvent('camera_health'))

  es.onopen = () => {
    // Client's own queue silently drops events past 100 while disconnected —
    // a reconnect (not the initial connect) means a gap may have opened, so
    // tell subscribers to backfill via REST.
    if (hasOpenedBefore && sawErrorSinceOpen) {
      for (const l of reconnectListeners) l()
    }
    hasOpenedBefore = true
    sawErrorSinceOpen = false
    notifyStatus()
  }
  es.onerror = () => {
    sawErrorSinceOpen = true
    // No manual retry logic needed — EventSource reconnects on its own using
    // the server's `retry: 5000` handshake line.
    notifyStatus()
  }
}

function disconnect() {
  es?.close()
  es = null
  hasOpenedBefore = false
  sawErrorSinceOpen = false
  lastEventAt = null
  notifyStatus()
}

export const streamStore = {
  /** Opens the connection. Call once the session is authenticated; closes on signOut(). */
  signIn: connect,
  signOut: disconnect,

  subscribe<K extends StreamEventName>(name: K, listener: Listener<K>): () => void {
    listeners[name].add(listener)
    return () => {
      listeners[name].delete(listener)
    }
  },

  /** Fires after a reconnect that followed a dropped connection — the cue to backfill via REST. */
  onReconnect(listener: ReconnectListener): () => void {
    reconnectListeners.add(listener)
    return () => reconnectListeners.delete(listener)
  },

  /** Fires on every readyState change and every received event — drives the connection-health indicator. */
  subscribeStatus(listener: StatusListener): () => void {
    statusListeners.add(listener)
    return () => statusListeners.delete(listener)
  },
  getReadyState(): number {
    return es ? es.readyState : EventSource.CLOSED
  },
  getLastEventAt(): number | null {
    return lastEventAt
  },
}
