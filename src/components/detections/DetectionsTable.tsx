import { Fragment, useState } from 'react'
import type { DetectionRead, PlateQuery } from '../../types/domain'
import { HoverThumbnail } from '../common/HoverThumbnail'
import { formatClockDateTime } from '../../lib/formatTime'

interface DetectionsTableProps {
  reads: DetectionRead[]
  /** Navigates to the Map view, centered on this plate's route. */
  onShowMap: (plate: PlateQuery) => void
  /** Navigates to the Route trace panel for this plate. */
  onTraceRoute: (plate: PlateQuery) => void
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

// Ports renderDetections()'s raw-reads branch (unified-grid-v2.html ~line 5583).
export function DetectionsTable({ reads, onShowMap, onTraceRoute }: DetectionsTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <>
      <thead id="detHead">
        <tr>
          <th />
          <th>Time</th>
          <th>Plate</th>
          <th>Camera</th>
          <th>District</th>
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
                <td className="expandcell">
                  {hasVariants && (
                    <button
                      className="expandbtn"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? '▲' : '▾'}
                    </button>
                  )}
                </td>
                <td className="m dim">{formatClockDateTime(r.seen_at)}</td>
                <td className="plate">{r.plate_display}</td>
                <td className="wrap">{r.camera_label}</td>
                <td className="dim">{r.district}</td>
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
                <td className="rowbtns">
                  <button
                    className="rowbtn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowMap(toPlateQuery(r))
                    }}
                  >
                    Map
                  </button>
                  <button
                    className="rowbtn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTraceRoute(toPlateQuery(r))
                    }}
                  >
                    Trace
                  </button>
                </td>
              </tr>
              {isExpanded && hasVariants && (
                <tr>
                  <td colSpan={7} className="dim">
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
