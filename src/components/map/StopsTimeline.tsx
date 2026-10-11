import { useState } from 'react'
import type { TraceLeg, TraceSighting } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'
import { groupSightingStays, formatDwell } from '../../lib/traceStays'

interface StopsTimelineProps {
  sightings: TraceSighting[]
  legs: TraceLeg[]
  onStopClick?: (sighting: TraceSighting) => void
  /** sighting_id of the stop currently selected (highlighted in the list and on the map). */
  selectedId?: number | null
}

interface StopInfo {
  s: TraceSighting
  leg?: TraceLeg
  first: boolean
}

function StopCard({ info, selectedId, onStopClick, child }: { info: StopInfo; selectedId?: number | null; onStopClick?: (s: TraceSighting) => void; child?: boolean }) {
  const { s, leg, first } = info
  const selected = s.sighting_id === selectedId
  return (
    <div
      className={`rstop${selected ? ' selected' : ''}${child ? ' stopchild' : ''}`}
      aria-current={selected ? 'true' : undefined}
      onClick={() => onStopClick?.(s)}
    >
      <div className="node" />
      <div className="card">
        <div className="rtop">
          <div className="t">{formatClockDateTime(s.seen_at)}</div>
        </div>
        <div className="where">{s.camera_label}</div>
        <div className="gap">{first ? 'first sighting' : `${leg?.gap_str ?? '—'}, ${leg?.km ?? '—'}km`}</div>
      </div>
    </div>
  )
}

// Vertical, most-recent-first list of route stops, overlaid transparently
// over the map (see .rtimeline in MapView). Each stop's "gap since last"
// is computed in chronological order first, then the list is reversed for
// display so descending order doesn't scramble which leg belongs to which stop.
// Consecutive reads at the same camera (a parked vehicle) fold into one
// expandable stay so they don't bury the real movement.
export function StopsTimeline({ sightings, legs, onStopClick, selectedId }: StopsTimelineProps) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const info = new Map<number, StopInfo>(
    sightings.map((s, i) => [s.sighting_id, { s, leg: i > 0 ? legs[i - 1] : undefined, first: i === 0 }]),
  )
  const rows = groupSightingStays(sightings).reverse()

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rstops">
      {rows.map((row) => {
        if (row.type === 'single') {
          const single = info.get(row.sighting.sighting_id)
          return single && <StopCard key={row.sighting.sighting_id} info={single} selectedId={selectedId} onStopClick={onStopClick} />
        }
        const { first: firstS, last: lastS } = row
        const key = firstS.sighting_id
        const isOpen = open.has(key)
        const inStay = row.sightings.some((s) => s.sighting_id === selectedId)
        const arrival = info.get(firstS.sighting_id)
        return (
          <div key={`stay-${key}`}>
            <div
              className={`rstop stay${inStay && !isOpen ? ' selected' : ''}`}
              aria-expanded={isOpen}
              onClick={() => {
                toggle(key)
                if (!inStay) onStopClick?.(lastS)
              }}
            >
              <div className="node" />
              <div className="card">
                <div className="rtop">
                  <div className="t">{formatClockDateTime(lastS.seen_at)}</div>
                  <span className="staycount">×{row.sightings.length}</span>
                </div>
                <div className="where">{firstS.camera_label}</div>
                <div className="gap">
                  stayed {formatDwell(row.dwell_s)}
                  {arrival && !arrival.first ? ` · arrived ${arrival.leg?.gap_str ?? '—'}, ${arrival.leg?.km ?? '—'}km` : ''}
                </div>
              </div>
            </div>
            {isOpen &&
              [...row.sightings].reverse().map((s) => {
                const child = info.get(s.sighting_id)
                return child && <StopCard key={s.sighting_id} info={child} selectedId={selectedId} onStopClick={onStopClick} child />
              })}
          </div>
        )
      })}
    </div>
  )
}
