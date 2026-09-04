import type { DetectionRead } from '../../types/domain'
import { ConfidenceBar } from './ConfidenceBar'
import { HoverThumbnail } from '../common/HoverThumbnail'

interface DetectionsTableProps {
  reads: DetectionRead[]
  onTracePlate: (plate: string) => void
}

// Ports renderDetections()'s raw-reads branch (unified-grid-v2.html ~line 5583).
export function DetectionsTable({ reads, onTracePlate }: DetectionsTableProps) {
  return (
    <>
      <thead id="detHead">
        <tr>
          <th>Time</th>
          <th>Plate</th>
          <th>OCR output</th>
          <th>Camera</th>
          <th>District</th>
          <th>Adapter</th>
          <th>Confidence</th>
          <th>Crop</th>
          <th>Flag</th>
          <th />
        </tr>
      </thead>
      <tbody id="detBody">
        {reads.map((r) => (
          <tr key={r.id}>
            <td className="m dim">{r.seen_time_str}</td>
            <td className="plate">{r.plate_display}</td>
            <td className={r.corrected ? 'm' : 'm dim'}>
              {r.corrected ? <span className="corr">{r.plate_raw_display}</span> : 'clean'}
            </td>
            <td>{r.camera_label}</td>
            <td className="dim">{r.district}</td>
            <td>
              <span className="tag">{r.adapter}</span>
            </td>
            <td>
              <ConfidenceBar value={r.confidence} low={r.confidence_low} />
            </td>
            <td>
              {r.crop_url ? (
                <HoverThumbnail src={r.crop_url} />
              ) : (
                <div className="mini-thumb">{r.plate_display.slice(0, 6)}</div>
              )}
            </td>
            <td>
              {r.watchlist_flag ? <span className="corr">{r.watchlist_flag}</span> : <span className="exact">—</span>}
            </td>
            <td>
              <button
                className="rowbtn"
                onClick={(e) => {
                  e.stopPropagation()
                  onTracePlate(r.plate_display)
                }}
              >
                Trace
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  )
}
