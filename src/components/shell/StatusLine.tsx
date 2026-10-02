import { useStreamStatus } from '../../hooks/useStreamStatus'

// 2px line across the very top of the window: green while the live update
// stream is healthy, amber when it has gone quiet, red while reconnecting.
export function StatusLine() {
  const { status, label } = useStreamStatus()
  return <div className={`statusline ${status}`} role="status" aria-label={`Live updates: ${label}`} title={label} />
}
