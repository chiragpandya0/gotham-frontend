import type { TraceLeg, TraceSighting } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'

interface StopsTimelineProps {
  sightings: TraceSighting[]
  legs: TraceLeg[]
  onStopClick?: (sighting: TraceSighting) => void
}

// Vertical, most-recent-first list of route stops, overlaid transparently
// over the map (see .rtimeline in MapView). Each stop's "gap since last"
// is computed in chronological order first, then the list is reversed for
// display so descending order doesn't scramble which leg belongs to which stop.
export function StopsTimeline({ sightings, legs, onStopClick }: StopsTimelineProps) {
  const stops = sightings.map((s, i) => ({ s, leg: i > 0 ? legs[i - 1] : undefined, first: i === 0 }))

  return (
    <div className="rstops">
      {[...stops].reverse().map(({ s, leg, first }) => (
        <div
          key={s.sighting_id}
          className={s.watchlist_flag ? 'rstop alert' : 'rstop'}
          onClick={() => onStopClick?.(s)}
        >
          <div className="node" />
          <div className="card">
            <div className="rtop">
              <div className="t">{formatClockDateTime(s.seen_at)}</div>
              {s.watchlist_flag && <div className="via">{s.watchlist_flag}</div>}
            </div>
            <div className="where">{s.camera_label}</div>
            <div className="gap">{first ? 'first sighting' : `${leg?.gap_str ?? '—'}, ${leg?.km ?? '—'}km`}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
