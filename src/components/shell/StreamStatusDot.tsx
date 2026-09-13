import { useStreamStatus } from '../../hooks/useStreamStatus'

// Makes a real connection drop visible instead of it looking identical to a
// quiet period — see useStreamStatus for how "idle" vs "reconnecting" is
// told apart.
export function StreamStatusDot() {
  const { status, label } = useStreamStatus()
  return (
    <span className={`stream-status ${status}`} title="Live update connection status">
      <i />
      {label}
    </span>
  )
}
