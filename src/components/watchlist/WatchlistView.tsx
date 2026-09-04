import { useEffect, useState } from 'react'
import { useMe } from '../../hooks/useMe'
import { useWatchlist } from '../../hooks/useWatchlist'
import { WatchlistQueue } from './WatchlistQueue'
import { WatchlistForm } from './WatchlistForm'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Stolen', value: 'stolen_vehicles' },
  { label: 'Wanted', value: 'wanted_persons' },
  { label: 'Blacklist', value: 'blacklist' },
  { label: 'Suspect', value: 'suspect' },
]

export function WatchlistView({ active }: { active: boolean }) {
  const { data: me } = useMe()
  const canManage = me?.permissions.granted.includes('manage_watchlist') ?? false

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  // The backend gates GET /api/watchlist on manage_watchlist too, so a user
  // without it would get a guaranteed 403 here — skip the request entirely.
  const { data } = useWatchlist(
    { list_name: filter === 'all' ? undefined : filter, plate: search || undefined },
    { enabled: canManage },
  )
  const entries = data?.entries ?? []

  useEffect(() => {
    if (!creating && selectedId === null && entries.length > 0) {
      setSelectedId(entries[0]!.id)
    }
  }, [entries, selectedId, creating])

  const selected = entries.find((e) => e.id === selectedId) ?? null

  return (
    <section className={active ? 'view on' : 'view'} id="viewWatchlist">
      <div className="queue">
        <div className="qhead">
          <div className="qheadrow">
            <b>
              Watchlist entries
              {data && <em style={{ marginLeft: 6, fontWeight: 400, fontSize: 11, color: 'var(--ink-3)' }}>{data.total} total</em>}
            </b>
            {canManage && (
              <button
                className="newbtn"
                onClick={() => {
                  setCreating(true)
                  setSelectedId(null)
                }}
              >
                + New entry
              </button>
            )}
          </div>
          {canManage && (
            <>
              <input className="qsearch" placeholder="Search plate…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="qfilters">
                {FILTERS.map((f) => (
                  <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {canManage && (
          <WatchlistQueue
            entries={entries}
            selectedId={creating ? null : selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              setCreating(false)
            }}
          />
        )}
      </div>

      {!canManage ? (
        <div className="detail">
          <div style={{ padding: 24, color: 'var(--ink-3)' }}>
            You don't have permission to manage the watchlist. Contact an administrator if you need access.
          </div>
        </div>
      ) : creating ? (
        <WatchlistForm
          mode="create"
          onCreated={(id) => {
            setCreating(false)
            setSelectedId(id)
          }}
          onCancel={() => setCreating(false)}
        />
      ) : selected ? (
        <WatchlistForm mode="edit" entry={selected} />
      ) : (
        <div className="detail">
          <div style={{ padding: 24, color: 'var(--ink-3)' }}>No entries yet.</div>
        </div>
      )}
    </section>
  )
}
