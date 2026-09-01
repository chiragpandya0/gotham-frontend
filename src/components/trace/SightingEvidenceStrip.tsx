import type { TraceSighting } from '../../types/domain'

export function SightingEvidenceStrip({ sightings }: { sightings: TraceSighting[] }) {
  return (
    <div className="evstrip" id="tEv">
      {sightings.map((s) => (
        <div key={s.sighting_id} className={s.corrected ? 'ev fix' : 'ev'}>
          <div className="crop">{s.plate_raw_display}</div>
          <div className="t">{s.seen_time_str}</div>
          <div className="w">
            {s.camera_label}
            <br />
            {s.district}
          </div>
          {s.corrected && <div className="badge2">corrected</div>}
          {s.watchlist_flag && <div className="badge2">{s.watchlist_flag}</div>}
        </div>
      ))}
    </div>
  )
}
