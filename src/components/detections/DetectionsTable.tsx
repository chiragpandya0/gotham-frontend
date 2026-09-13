import { Fragment, useState } from 'react'
import type { DetectionRead, PlateQuery } from '../../types/domain'
import { ConfidenceBar } from './ConfidenceBar'
import { HoverThumbnail } from '../common/HoverThumbnail'

interface DetectionsTableProps {
  reads: DetectionRead[]
  onTracePlate: (plate: PlateQuery) => void
}

// No plate_type is returned per-row today — every seeded read is a standard-state
// plate, so tracing from a row assumes that type.
function toPlateQuery(r: DetectionRead): PlateQuery {
  const seg = r.plate_segments
  return {
    plate_type: 'STANDARD_STATE',
    state_code: seg.state ?? undefined,
    rto_code: seg.rto ?? undefined,
    series: seg.series ?? undefined,
    number: seg.number ?? undefined,
  }
}

function resolveTagClass(confidence: number): string {
  if (confidence >= 0.85) return 'exact'
  if (confidence >= 0.6) return 'tag'
  return 'corr'
}

// Ports renderDetections()'s raw-reads branch (unified-grid-v2.html ~line 5583).
export function DetectionsTable({ reads, onTracePlate }: DetectionsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <>
      <thead id="detHead">
        <tr>
          <th>Time</th>
          <th>Plate</th>
          <th>Resolve</th>
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
        {reads.map((r) => {
          const isExpanded = expanded === r.id
          const hasVariants = (r.top_variants?.length ?? 0) > 0
          return (
            <Fragment key={r.id}>
              <tr>
                <td className="m dim">{r.seen_time_str}</td>
                <td className="plate">{r.plate_display}</td>
                <td>
                  <span
                    className={resolveTagClass(r.resolve_confidence)}
                    title={`resolve cost ${r.resolve_cost.toFixed(2)}`}
                    style={hasVariants ? { cursor: 'pointer' } : undefined}
                    onClick={hasVariants ? () => setExpanded(isExpanded ? null : r.id) : undefined}
                  >
                    {r.resolve_confidence.toFixed(2)}
                    {hasVariants && (isExpanded ? ' ▲' : ` ▾${r.top_variants?.length ?? 0}`)}
                  </span>
                </td>
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
                      onTracePlate(toPlateQuery(r))
                    }}
                  >
                    Trace
                  </button>
                </td>
              </tr>
              {isExpanded && hasVariants && (
                <tr>
                  <td colSpan={10} className="dim">
                    OCR raw: <span className="corr">{r.ocr_raw_text}</span> — alternate readings considered (lower cost is closer):{' '}
                    {[...(r.top_variants ?? [])]
                      .sort((a, b) => a[1] - b[1])
                      .map(([display, cost]) => `${display} (${cost.toFixed(2)})`)
                      .join(', ')}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </>
  )
}
