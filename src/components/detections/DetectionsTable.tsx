import { Fragment, useState } from 'react'
import type { DetectionRead } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'

interface DetectionsTableProps {
  reads: DetectionRead[]
  /** Navigates to the Map view, centered on this detection's route. */
  onShowMap: (detectionId: number) => void
  /** Navigates to the Route trace panel for this detection. */
  onTraceRoute: (detectionId: number) => void
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
                  {r.watchlist_flag ? <span className="corr">{r.watchlist_flag}</span> : <span className="exact">—</span>}
                </td>
                <td className="rowbtns">
                  <button
                    className="rowbtn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowMap(r.id)
                    }}
                  >
                    Map
                  </button>
                  <button
                    className="rowbtn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTraceRoute(r.id)
                    }}
                  >
                    Trace
                  </button>
                </td>
              </tr>
              {isExpanded && hasVariants && (
                <tr>
                  <td colSpan={6} className="dim">
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
