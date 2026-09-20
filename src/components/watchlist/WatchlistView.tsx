import { useEffect, useMemo, useRef, useState } from 'react'
import { useMe } from '../../hooks/useMe'
import { useWatchlist } from '../../hooks/useWatchlist'
import { useWatchlistDraftRequest } from '../../hooks/useWatchlistDraftRequest'
import { parsePlateDisplay, isPlateQueryEmpty } from '../../lib/plateQuery'
import type { PlateQuery } from '../../types/domain'
import { WatchlistQueue } from './WatchlistQueue'
import { WatchlistForm } from './WatchlistForm'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Stolen vehicle', value: 'stolen_vehicle' },
  { label: 'Wanted vehicle', value: 'wanted_vehicle' },
  { label: 'Suspect vehicle', value: 'suspect_vehicle' },
  { label: 'Missing person', value: 'missing_person' },
  { label: 'Wanted person', value: 'wanted_person' },
  { label: 'Suspect person', value: 'suspect_person' },
]

export function WatchlistView({ active }: { active: boolean }) {
  const { data: me } = useMe()
  const canManage = me?.permissions.granted.includes('manage_watchlist') ?? false

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [draftPlate, setDraftPlate] = useState<PlateQuery | null>(null)

  // Driven by Trace view's "Add to watchlist" button (via watchlistDraftStore)
  // — this view stays mounted the whole session (see Stage), so a plain
  // read-at-mount wouldn't catch a request fired while already on this tab;
  // token-guarded the same way useMapFocusRequest is, so a second click
  // (e.g. after cancelling) re-opens the form even for the same plate.
  const draftRequest = useWatchlistDraftRequest()
  const appliedDraftToken = useRef<number | null>(null)
  useEffect(() => {
    if (!draftRequest || appliedDraftToken.current === draftRequest.token) return
    appliedDraftToken.current = draftRequest.token
    setDraftPlate(draftRequest.plate)
    setCreating(true)
    setSelectedId(null)
  }, [draftRequest])

  // The search box is free text but the backend now wants segment fields
  // (same shape as detections/trace) — parse it client-side. An unparsed
  // single token (e.g. just a number) still filters on that one segment.
  const searchQuery = useMemo(() => (search ? parsePlateDisplay(search) : null), [search])

  // The backend gates GET /api/watchlist on manage_watchlist too, so a user
  // without it would get a guaranteed 403 here — skip the request entirely.
  const { data } = useWatchlist(
    {
      list_name: filter === 'all' ? undefined : filter,
      ...(searchQuery && !isPlateQueryEmpty(searchQuery) ? searchQuery : {}),
    },
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
                  setDraftPlate(null)
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
          initialPlate={draftPlate}
          onCreated={(id) => {
            setCreating(false)
            setDraftPlate(null)
            setSelectedId(id)
          }}
          onCancel={() => {
            setCreating(false)
            setDraftPlate(null)
          }}
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
