import type { WatchlistEntry } from '../../types/domain'

export const LIST_LABEL: Record<string, string> = {
  stolen_vehicles: 'Stolen vehicle',
  wanted_persons: 'Wanted person',
  blacklist: 'Blacklist',
  suspect: 'Suspect',
}

export const PRI_CLASS: Record<string, string> = { critical: 'pri crit', high: 'pri high', medium: 'pri med' }
export const PRI_LABEL: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium' }

interface WatchlistQueueProps {
  entries: WatchlistEntry[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function WatchlistQueue({ entries, selectedId, onSelect }: WatchlistQueueProps) {
  if (entries.length === 0) {
    return <div style={{ padding: '20px 14px', color: 'var(--ink-3)', fontSize: 12.5 }}>No entries match this filter.</div>
  }

  return (
    <div className="qlist">
      {entries.map((e) => (
        <div key={e.id} className="qitem" aria-selected={e.id === selectedId} onClick={() => onSelect(e.id)}>
          <div className="l1">
            <span className="p">{e.plate_display ?? e.subject_ref}</span>
            <span className={`wldot${e.active ? '' : ' off'}`} />
          </div>
          <div className="l2">
            {LIST_LABEL[e.list_name] ?? e.list_name}
            {e.plate_display && e.subject_ref ? ` · ${e.subject_ref}` : ''}
          </div>
          <div className="l3">
            <span className="tag">{(LIST_LABEL[e.list_name] ?? e.list_name).toUpperCase()}</span>
            <span className={PRI_CLASS[e.priority] ?? 'pri med'}>{PRI_LABEL[e.priority] ?? e.priority}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
