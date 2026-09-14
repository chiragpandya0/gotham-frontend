import { useEffect, useState } from 'react'

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatSession(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function HeaderClock() {
  const [now, setNow] = useState(() => new Date())
  const [sessionStart] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="clockrow">
      <span id="clkDate">{formatDate(now)}</span>
      <span className="sep" />
      <span id="clkTime">{formatTime(now)}</span>
      <span className="sep" />
      <span>
        session <span id="sessT">{formatSession(now.getTime() - sessionStart)}</span>
      </span>
    </div>
  )
}
