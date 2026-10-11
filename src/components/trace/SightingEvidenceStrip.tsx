import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TraceSighting } from '../../types/domain'
import { formatClockDateTime, formatClockTime } from '../../lib/formatTime'
import { formatDwell, groupSightingStays } from '../../lib/traceStays'
import { ImageLightbox } from '../common/ImageLightbox'
import { FramedImage } from '../common/FramedImage'

// Same 0.85 "low" cutoff as ConfidenceBar; below 0.60 is treated as poor.
function confClass(c: number): string {
  return c >= 0.85 ? 'hi' : c >= 0.6 ? 'mid' : 'lo'
}

interface StackInfo {
  count: number
  last: TraceSighting
  dwell_s: number
  open: boolean
  onToggle: () => void
}

function EvidenceCard({
  s,
  stack,
  grouped,
  onZoom,
}: {
  s: TraceSighting
  stack?: StackInfo
  /** Part of an unfolded stay — marks the card so the run reads as one unit. */
  grouped?: boolean
  onZoom: (s: TraceSighting) => void
}) {
  const stacked = stack && !stack.open
  const cls = ['ev', s.corrected ? 'fix' : '', stacked ? 'stacked' : '', grouped ? 'grouped' : ''].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      <div className="evimg">
        {s.frame_url ? (
          <>
            <FramedImage src={s.frame_url} focus={s.vehicle_bbox ?? s.plate_bbox} />
            <button className="expand" onClick={() => onZoom(s)} aria-label="View full-size image" title="View full size">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
              </svg>
            </button>
          </>
        ) : (
          <div className="placeholder">{s.plate_display}</div>
        )}
        {s.watchlist_flag && (
          <div className="evflags">
            <span className="badge2">{s.watchlist_flag}</span>
          </div>
        )}
        {stack && (
          <button
            className="evstackbtn"
            onClick={stack.onToggle}
            aria-expanded={stack.open}
            title={stack.open ? 'Collapse these reads' : `Show all ${stack.count} reads at this camera`}
          >
            {stack.open ? (
              <>
                <ChevronUp size={12} strokeWidth={1.8} />
                Collapse
              </>
            ) : (
              <>
                ×{stack.count}
                <ChevronDown size={12} strokeWidth={1.8} />
              </>
            )}
          </button>
        )}
      </div>
      <div className="evbody">
        <div className="evplate">
          <div className="plate">{s.plate_display}</div>
          <span className={`evconf ${confClass(s.confidence)}`} title="Read confidence">
            {s.confidence.toFixed(2)}
          </span>
        </div>
        <div className="t">
          {formatClockDateTime(s.seen_at)}
          {stacked && ` → ${formatClockTime(stack.last.seen_at)}`}
        </div>
        <div className="w">
          {s.camera_label}
          <br />
          {stacked ? `stayed ${formatDwell(stack.dwell_s)}` : s.district}
        </div>
      </div>
    </div>
  )
}

// Consecutive reads at one camera (a parked vehicle) fold into a single
// stacked card — the first read on top, a corner pill with the count — and
// unfold in place when the pill is clicked.
export function SightingEvidenceStrip({ sightings }: { sightings: TraceSighting[] }) {
  const [zoomed, setZoomed] = useState<TraceSighting | null>(null)
  const [open, setOpen] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="evstrip" id="tEv">
      {groupSightingStays(sightings).map((row) => {
        if (row.type === 'single') return <EvidenceCard key={row.sighting.sighting_id} s={row.sighting} onZoom={setZoomed} />
        const id = row.first.sighting_id
        const isOpen = open.has(id)
        const stack = { count: row.sightings.length, last: row.last, dwell_s: row.dwell_s, open: isOpen, onToggle: () => toggle(id) }
        if (!isOpen) return <EvidenceCard key={id} s={row.first} stack={stack} onZoom={setZoomed} />
        return row.sightings.map((s) => (
          <EvidenceCard key={s.sighting_id} s={s} stack={s === row.first ? stack : undefined} grouped onZoom={setZoomed} />
        ))
      })}

      {zoomed?.frame_url && (
        <ImageLightbox
          src={zoomed.frame_url}
          boxes={[
            zoomed.vehicle_bbox && { ...zoomed.vehicle_bbox, className: 'bbox-vehicle' },
            zoomed.plate_bbox && { ...zoomed.plate_bbox, className: 'bbox-plate', magnify: true },
          ]}
          caption={`${zoomed.plate_display} · ${zoomed.camera_label}`}
          onClose={() => setZoomed(null)}
        />
      )}
    </div>
  )
}
