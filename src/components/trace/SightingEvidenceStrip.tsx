import { useState } from 'react'
import type { TraceSighting } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'
import { ImageLightbox } from '../common/ImageLightbox'

export function SightingEvidenceStrip({ sightings }: { sightings: TraceSighting[] }) {
  const [zoomed, setZoomed] = useState<TraceSighting | null>(null)

  return (
    <div className="evstrip" id="tEv">
      {sightings.map((s) => (
        <div key={s.sighting_id} className={s.corrected ? 'ev fix' : 'ev'}>
          <div className="evimg">
            {s.frame_url ? (
              <>
                <img src={s.frame_url} alt="" />
                <button
                  className="expand"
                  onClick={() => setZoomed(s)}
                  aria-label="View full-size image"
                  title="View full size"
                >
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="placeholder">{s.plate_raw_display}</div>
            )}
          </div>
          <div className="evbody">
            <div className="plate">{s.plate_raw_display}</div>
            <div className="t">{formatClockDateTime(s.seen_at)}</div>
            <div className="w">
              {s.camera_label}
              <br />
              {s.district}
            </div>
            {s.corrected && <div className="badge2">corrected</div>}
            {s.watchlist_flag && <div className="badge2">{s.watchlist_flag}</div>}
          </div>
        </div>
      ))}

      {zoomed?.frame_url && (
        <ImageLightbox
          src={zoomed.frame_url}
          caption={`${zoomed.plate_raw_display} · ${zoomed.camera_label}`}
          onClose={() => setZoomed(null)}
        />
      )}
    </div>
  )
}
