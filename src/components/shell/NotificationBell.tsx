import { useEffect, useRef, useState } from 'react'
import { IconBell } from '../../styles/icons'
import { useAlerts } from '../../hooks/useAlerts'
import { useSelectedAlert } from '../../hooks/useSelectedAlert'
import { useView } from '../../state/viewStore'

const STATE_CLASS: Record<string, string> = { open: 'open', acknowledged: 'ack', dispatched: 'disp' }
const MAX_ROWS = 6

// Not part of the original mockup (which only jumps to the Alerts view on
// click, same as the rail's alert icon) — added because a bell that does
// nothing when you're already on that view reads as broken.
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data } = useAlerts()
  const [, setSelectedId] = useSelectedAlert()
  const { setView } = useView()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const active = data?.counts.active ?? 0
  const rows = (data?.alerts ?? []).filter((a) => a.state === 'open' || a.state === 'dispatched').slice(0, MAX_ROWS)
  const overflow = active - rows.length

  function openAlert(id: number) {
    setSelectedId(id)
    setView('alerts')
    setOpen(false)
  }

  function viewAll() {
    setView('alerts')
    setOpen(false)
  }

  return (
    <div
      className="bell"
      id="bell"
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="Notifications"
      aria-haspopup="true"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      <IconBell />
      {!!active && <u id="bellN">{active}</u>}

      {open && (
        <div className="menu on" style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
          <div className="mh">
            <b style={{ fontSize: 13 }}>Active alerts</b>
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '18px 14px', color: 'var(--ink-3)', fontSize: 12 }}>No active alerts.</div>
          ) : (
            <div className="qlist" style={{ maxHeight: 320 }}>
              {rows.map((a) => (
                <div key={a.id} className="qitem" onClick={() => openAlert(a.id)}>
                  <div className="l1">
                    <span className="p" style={{ color: a.priority === 'critical' ? 'var(--crit)' : 'var(--signal)' }}>
                      {a.plate_display}
                    </span>
                    <span className="tm">{a.raised_time_str}</span>
                  </div>
                  <div className="l2">{a.kind}</div>
                  <div className="l3">
                    <span className={a.priority === 'critical' ? 'pri crit' : 'pri high'}>{a.priority_label}</span>
                    <span className={`st ${STATE_CLASS[a.state] ?? a.state}`}>{a.state_label}</span>
                    <span className="st" style={{ marginLeft: 'auto' }}>
                      {a.camera_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mact">
            <button onClick={viewAll}>{overflow > 0 ? `View all alerts (${overflow} more)` : 'View all alerts'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
