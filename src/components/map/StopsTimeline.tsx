import type { TraceLeg, TraceSighting } from '../../types/domain'

interface StopsTimelineProps {
  sightings: TraceSighting[]
  legs: TraceLeg[]
  onStopClick?: (sighting: TraceSighting) => void
}

// Ports renderStops() (unified-grid-v2.html ~line 4486).
export function StopsTimeline({ sightings, legs, onStopClick }: StopsTimelineProps) {
  return (
    <div className="stops" id="stops">
      {sightings.map((s, i) => {
        const leg = i > 0 ? legs[i - 1] : undefined
        return (
          <div key={s.sighting_id} className={s.watchlist_flag ? 'stop alert' : 'stop'} onClick={() => onStopClick?.(s)}>
            <div className="node" />
            <div className="t">{s.seen_time_str}</div>
            <div className="where">{s.camera_label}</div>
            <div className="via">{s.watchlist_flag ? `${s.watchlist_flag} match fired` : s.district}</div>
            <div className="gap">
              {i === 0 ? 'first sighting' : `+${leg?.gap_str ?? '—'} since last`} · confidence {s.confidence}
            </div>
          </div>
        )
      })}
    </div>
  )
}
