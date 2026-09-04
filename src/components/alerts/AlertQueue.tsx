import type { AlertSummary } from '../../types/domain'

interface AlertQueueProps {
  alerts: AlertSummary[]
  selectedId: number | null
  onSelect: (id: number) => void
}

const STATE_CLASS: Record<string, string> = { open: 'open', acknowledged: 'ack', dispatched: 'disp' }
const PRI_CLASS: Record<string, string> = { critical: 'pri crit', high: 'pri high', medium: 'pri med' }

// Ports renderQueue()'s .qitem markup (unified-grid-v2.html ~line 4528).
export function AlertQueue({ alerts, selectedId, onSelect }: AlertQueueProps) {
  return (
    <div className="qlist" id="qlist">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="qitem"
          aria-selected={a.id === selectedId}
          onClick={() => onSelect(a.id)}
        >
          <div className="l1">
            <span className="p">{a.plate_display}</span>
            <span className="tm">{a.raised_time_str}</span>
          </div>
          <div className="l2">{a.kind}</div>
          <div className="l3">
            <span className={PRI_CLASS[a.priority] ?? 'pri med'}>{a.priority_label}</span>
            <span className={`st ${STATE_CLASS[a.state] ?? a.state}`}>{a.state_label}</span>
            <span className="st" style={{ marginLeft: 'auto' }}>
              #{a.id}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
