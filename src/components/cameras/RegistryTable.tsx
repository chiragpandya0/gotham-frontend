import { Fragment, useState } from 'react'
import type { Camera } from '../../types/domain'
import { CameraPreviewPlayer } from './CameraPreviewPlayer'

const HEALTH_LABEL: Record<string, string> = { live: 'Live', deg: 'Degraded', rec: 'Reconnecting' }

interface RegistryTableProps {
  cameras: Camera[]
  onSelect?: (camera: Camera) => void
}

// Ports renderRegistry()'s row markup (unified-grid-v2.html ~line 4943).
export function RegistryTable({ cameras, onSelect }: RegistryTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
                  ▶
                </button>
              </td>
              <td className="m dim">{String(c.id).padStart(2, '0')}</td>
              <td>{c.name}</td>
              <td className="dim">{c.district ?? '—'}</td>
              <td className="dim">{c.department ?? '—'}</td>
              <td>
                <span className="tag">{c.adapter ?? '—'}</span>
              </td>
              <td className="m">
                {c.codec ? c.codec.toUpperCase() : <span className="tag unk">unprobed</span>}
              </td>
              <td className="m">{c.resolution || '—'}</td>
              <td className="m">{c.declared_fps ?? '—'}</td>
              <td className="m">{c.bitrate_kbps ? `${c.bitrate_kbps} kbps` : '—'}</td>
              <td>
                <span className={`hp ${state}`}>
                  <i />
                  {label}
                </span>
              </td>
              <td className="m dim">{c.health?.last_frame_str ?? '—'}</td>
              <td className="m dim">{c.health?.reconnects_24h ?? '—'}</td>
              <td className="m dim">{c.health?.decode_errors_24h ?? '—'}</td>
            </tr>
            {expanded && (
              <tr className="expander">
                <td colSpan={14}>
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
