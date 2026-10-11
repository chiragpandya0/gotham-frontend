import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { TraceLeg } from '../../types/domain'
import { verdictClass, capitalize } from './legVerdict'
import { groupLegStays, formatDwell } from '../../lib/traceStays'

interface KinematicLegsTableProps {
  legs: TraceLeg[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function LegRow({ leg, index, selected, child, onSelect }: { leg: TraceLeg; index: number; selected: boolean; child?: boolean; onSelect: (i: number) => void }) {
  return (
    <tr className={child ? 'staychild' : undefined} aria-selected={selected} onClick={() => onSelect(index)}>
      <td className="m dim">{index + 1}</td>
      <td>{leg.from_label}</td>
      <td>{leg.to_label}</td>
      <td className="m">{leg.gap_str}</td>
      <td className="m">{leg.km.toFixed(1)} km</td>
      <td className="m">{leg.kmh} km/h</td>
      <td>
        <span className={verdictClass(leg.verdict)}>
          <i />
          {capitalize(leg.verdict)}
        </span>
      </td>
    </tr>
  )
}

// Runs of consecutive same-camera legs (a parked vehicle re-read over and
// over) collapse into one expandable "stay" row. Leg numbers stay the
// original per-leg numbers, so nothing renumbers when a stay is expanded.
export function KinematicLegsTable({ legs, selectedIndex, onSelect }: KinematicLegsTableProps) {
  const [open, setOpen] = useState<Set<number>>(new Set())
  const rows = groupLegStays(legs)

  function toggle(first: number) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(first)) next.delete(first)
      else next.add(first)
      return next
    })
  }

  return (
    <tbody id="tSeg">
      {rows.map((row) => {
        if (row.type === 'leg') {
          return <LegRow key={row.item.index} leg={row.item.leg} index={row.item.index} selected={row.item.index === selectedIndex} onSelect={onSelect} />
        }
        const first = row.first.index
        const last = row.last.index
        const isOpen = open.has(first)
        const inStay = selectedIndex >= first && selectedIndex <= last
        return (
          <Fragment key={`stay-${first}`}>
            <tr
              className="stayrow"
              aria-selected={inStay && !isOpen}
              aria-expanded={isOpen}
              onClick={() => {
                toggle(first)
                if (!inStay) onSelect(first)
              }}
            >
              <td className="m dim">
                <span className="staychev">{isOpen ? <ChevronDown size={13} strokeWidth={1.5} /> : <ChevronRight size={13} strokeWidth={1.5} />}</span>
                {first + 1}–{last + 1}
              </td>
              <td colSpan={2}>
                {row.label} <span className="staytag">stayed · {row.items.length + 1} reads</span>
              </td>
              <td className="m">{formatDwell(row.dwell_s)}</td>
              <td className="m">0.0 km</td>
              <td className="m">—</td>
              <td>
                <span className="verdict stay">
                  <i />
                  Parked at camera
                </span>
              </td>
            </tr>
            {isOpen &&
              row.items.map(({ leg, index }) => (
                <LegRow key={index} leg={leg} index={index} selected={index === selectedIndex} child onSelect={onSelect} />
              ))}
          </Fragment>
        )
      })}
    </tbody>
  )
}
