import { useEffect, useState } from 'react'
import { useStreamStatus } from '../../hooks/useStreamStatus'

// Hidden while connected. When the live update stream cannot reach the
// backend (or the browser itself is offline) a red strip with a message
// takes its place across the top of the window.
export function StatusLine() {
  const { status } = useStreamStatus()
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const up = () => setBrowserOnline(true)
    const down = () => setBrowserOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const offline = !browserOnline || status === 'reconnecting'
  const message = browserOnline
    ? 'Offline: cannot reach the server. Live updates are paused and the data shown may be out of date. Retrying…'
    : 'Offline: this device has no network connection. Live updates are paused and the data shown may be out of date.'

  return (
    <div className={`statusline${offline ? ' offline' : ''}`} role="status" aria-live="polite">
      {offline && message}
    </div>
  )
}
