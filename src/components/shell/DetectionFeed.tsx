import { useLiveDetectionsFeed } from '../../hooks/useLiveDetectionsFeed'

// Ports addRow()'s .row markup (unified-grid-v2.html ~line 4720).
export function DetectionFeed() {
  const rows = useLiveDetectionsFeed()

  return (
    <div className="pane">
      <h3>
        Live plate detections <em id="cnt">{rows.length === 0 ? 'loading' : `${rows.length} shown`}</em>
      </h3>
      <div className="feed" id="feed">
        {rows.map((r) => (
          <div key={r.id} className="row">
            <div className="p">{r.plate_display}</div>
            <div className="tm">{r.seen_time_str}</div>
            <div className="c">{r.camera_label}</div>
            <div className="meta2">
              <span className={`rq${r.read_quality === 'partial' ? ' partial' : ''}`}>
                <i />
                {r.read_quality}
              </span>
              <span className="cf">{r.confidence.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
