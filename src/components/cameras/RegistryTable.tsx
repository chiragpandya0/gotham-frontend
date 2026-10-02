import { Fragment, useState } from 'react'
import { ChevronRight, MapPin, Pencil } from 'lucide-react'
import type { Camera } from '../../types/domain'
import { useView } from '../../state/viewStore'
import { mapFocusStore } from '../../state/mapFocusStore'
import { messageToastStore } from '../../state/messageToastStore'
import { CameraPreviewPlayer } from './CameraPreviewPlayer'

const HEALTH_LABEL: Record<string, string> = { live: 'Live', deg: 'Degraded', rec: 'Reconnecting', down: 'Down' }

interface RegistryTableProps {
  cameras: Camera[]
  onSelect?: (camera: Camera) => void
  onEdit?: (camera: Camera) => void
}

// Ports renderRegistry()'s row markup (unified-grid-v2.html ~line 4943).
export function RegistryTable({ cameras, onSelect, onEdit }: RegistryTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const { setView } = useView()

  function viewOnMap(c: Camera) {
    if (typeof c.lat !== 'number' || typeof c.lon !== 'number') {
      messageToastStore.show('Geolocation is missing for this camera')
      return
    }
    mapFocusStore.focus([c.id])
    setView('map')
  }

  return (
    <tbody id="regBody">
      {cameras.map((c) => {
        const state = c.health?.state ?? 'live'
        const label = HEALTH_LABEL[state] ?? state
        const expanded = expandedId === c.id
        return (
          <Fragment key={c.id}>
            <tr data-cam={c.id} className={expanded ? 'open-row' : undefined} onClick={() => onSelect?.(c)}>
              <td className="exp">
                <button
                  className="chev"
                  aria-label="Show live preview"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedId(expanded ? null : c.id)
                  }}
                >
                  <ChevronRight size={14} strokeWidth={1.5} />
                </button>
              </td>
              <td className="m dim">{String(c.id).padStart(2, '0')}</td>
              <td>{c.name}</td>
              <td className="dim">{c.district ?? '—'}</td>
              <td className="dim">{c.department ?? '—'}</td>
              <td>
                <span className={`hp ${state}`}>
                  <i />
                  {label}
                </span>
              </td>
              <td className="m">{c.measured_fps ?? c.declared_fps ?? '—'}</td>
              <td className="m dim">{c.health?.last_frame_str ?? '—'}</td>
              <td className="rowbtns">
                <button
                  className="navlink"
                  onClick={(e) => {
                    e.stopPropagation()
                    viewOnMap(c)
                  }}
                >
                  <MapPin size={13} strokeWidth={1.5} />
                  Map
                </button>
                {onEdit && (
                  <button
                    className="rowbtn iconbtn"
                    aria-label={`Edit ${c.name}`}
                    title="Edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(c)
                    }}
                  >
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                )}
              </td>
            </tr>
            {expanded && (
              <tr className="expander">
                <td colSpan={9}>
                  <CameraPreviewPlayer camera={c} />
                </td>
              </tr>
            )}
          </Fragment>
        )
      })}
    </tbody>
  )
}
