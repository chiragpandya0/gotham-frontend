import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, Route, Star } from 'lucide-react'
import type { DetectionRead } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'
import { PlateText } from '../common/PlateText'
import { FlagChip } from './FlagChip'
import { ConfidenceBar } from './ConfidenceBar'
import { usePinRead } from '../../hooks/usePinRead'

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
  const pinRead = usePinRead()

  return (
    <>
      <thead id="detHead">
        <tr>
          <th />
          <th />
          <th>Time</th>
          <th>Plate</th>
          <th>Confidence</th>
          <th>Camera</th>
          <th>District</th>
          <th>Flag</th>
          <th />
        </tr>
      </thead>
      <tbody id="detBody">
        {reads.map((r) => {
          const isExpanded = expanded === r.id
          // variants[0] is the reading shown on the row (plate_display) — only the rest are alternates.
          const top = r.variants?.[0]
          const alternates = (r.variants ?? []).slice(1)
          const hasVariants = alternates.length > 0
          const confidence = top?.read_confidence ?? r.confidence
          return (
            <Fragment key={r.id}>
              <tr>
                <td className="pincell">
                  <button
                    className={r.is_pinned ? 'pinbtn on' : 'pinbtn'}
                    aria-label={r.is_pinned ? 'Unpin read' : 'Pin read'}
                    aria-pressed={r.is_pinned}
                    onClick={() => pinRead.mutate({ id: r.id, pinned: !r.is_pinned })}
                  >
                    <Star size={14} strokeWidth={1.5} fill={r.is_pinned ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="expandcell">
                  {hasVariants && (
                    <button
                      className="expandbtn"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      onClick={() => setExpanded(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                    </button>
                  )}
                </td>
                <td className="m dim">{formatClockDateTime(r.seen_at)}</td>
                <td className="plate">
                  <PlateText value={r.plate_display} />
                </td>
                <td>
                  <ConfidenceBar value={confidence} low={confidence < 0.85} />
                </td>
                <td className="wrap">{r.camera_label}</td>
                <td className="dim">{r.district}</td>
                <td>
                  <FlagChip flag={r.watchlist_flag} />
                </td>
                <td className="rowbtns">
                  <button
                    className="navlink"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTraceRoute(r.id)
                    }}
                  >
                    <Route size={13} strokeWidth={1.5} />
                    Trace
                  </button>
                  <button
                    className="navlink"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowMap(r.id)
                    }}
                  >
                    <MapPin size={13} strokeWidth={1.5} />
                    Map
                  </button>
                </td>
              </tr>
              {isExpanded && hasVariants && (
                <tr>
                  <td colSpan={9} className="ocrnote">
                    OCR raw: <span className="corr">{r.ocr_raw_text}</span>
                    <table className="altreads">
                      <thead>
                        <tr>
                          <th>Alternate reading</th>
                          <th className="r">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...alternates]
                          .sort((a, b) => b.read_confidence - a.read_confidence)
                          .map((v) => (
                            <tr key={v.plate}>
                              <td>{v.plate}</td>
                              <td className="r">{v.read_confidence.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
