import { useEffect, useState } from 'react'
import { useAlerts } from '../../hooks/useAlerts'
import { useSelectedAlert } from '../../hooks/useSelectedAlert'
import { AlertQueue } from './AlertQueue'
import { AlertDetail } from './AlertDetail'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Acknowledged', value: 'acknowledged' },
  { label: 'Dispatched', value: 'dispatched' },
]

export function AlertsView({ active }: { active: boolean }) {
  const [filter, setFilter] = useState('all')
  const { data } = useAlerts(filter)
  const [selectedId, setSelectedId] = useSelectedAlert()

  const alerts = data?.alerts ?? []

  useEffect(() => {
    if (selectedId === null && alerts.length > 0) {
      setSelectedId(alerts[0]!.id)
    }
  }, [alerts, selectedId, setSelectedId])

  return (
    <section className={active ? 'view on' : 'view'} id="viewAlerts">
      <div className="queue">
        <div className="qhead">
          <b>Alert queue</b>
          <div className="qfilters">
            {FILTERS.map((f) => (
              <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <AlertQueue alerts={alerts} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {selectedId !== null ? (
        <AlertDetail id={selectedId} />
      ) : (
        <div className="detail">
          <div style={{ padding: 24, color: 'var(--ink-3)' }}>No alerts in view.</div>
        </div>
      )}
    </section>
  )
}
