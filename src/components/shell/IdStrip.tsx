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

interface IdStripProps {
  classification: string
  instance: string
}

export function IdStrip({ classification, instance }: IdStripProps) {
  const [now, setNow] = useState(() => new Date())
  const [sessionStart] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="idstrip">
      <div className="org">
        <span className="crest">GP</span>Gujarat Police
      </div>
      <span className="sep" />
      <span>{instance}</span>
      <span className="sep" />
      <span>State Command Centre, Gandhinagar</span>
      <div className="classif">
        <span>{classification}</span>
        <span style={{ color: 'var(--ink-3)' }}>for official use only</span>
      </div>
      <div className="rt">
        <span id="clkDate">{formatDate(now)}</span>
        <span className="sep" />
        <span id="clkTime">{formatTime(now)}</span>
        <span className="sep" />
        <span>
          session <span id="sessT">{formatSession(now.getTime() - sessionStart)}</span>
        </span>
      </div>
    </div>
  )
}
