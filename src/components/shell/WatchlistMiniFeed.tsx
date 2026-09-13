import { useAlerts } from '../../hooks/useAlerts'
import { useSelectedAlert } from '../../hooks/useSelectedAlert'
import { useView } from '../../state/viewStore'
import { formatClockTime } from '../../lib/formatTime'

// Ports renderQueue()'s .mini markup (unified-grid-v2.html ~line 4569).
export function WatchlistMiniFeed() {
  const { data } = useAlerts()
  const [, setSelectedAlert] = useSelectedAlert()
  const { setView } = useView()
  const alerts = data?.alerts ?? []
  const active = data?.counts.active

  return (
    <div className="pane sidealerts">
      <h3>
        Watchlist matches <em id="openCount">{active !== undefined ? `${active} awaiting action` : 'loading'}</em>
      </h3>
      <div className="feed" id="miniAlerts">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={a.priority === 'critical' ? 'mini crit' : 'mini'}
            onClick={() => {
              setSelectedAlert(a.id)
              setView('alerts')
            }}
          >
            <div className="l1">
              <span className="p">{a.plate_display}</span>
              <span className="k">{a.kind}</span>
              <span className="tm">{a.raised_time_str ?? (a.raised_at ? formatClockTime(a.raised_at) : '—')}</span>
            </div>
            <div className="l2">
              {a.camera_label} · confidence {a.confidence}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
