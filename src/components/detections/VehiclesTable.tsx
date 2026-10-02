import { Route } from 'lucide-react'
import type { PlateQuery, VehicleGroup } from '../../types/domain'
import { ConfidenceBar } from './ConfidenceBar'
import { parsePlateDisplay } from '../../lib/plateQuery'
import { PlateText } from '../common/PlateText'
import { FlagChip } from './FlagChip'

interface VehiclesTableProps {
  vehicles: VehicleGroup[]
  onTracePlate: (plate: PlateQuery) => void
}

// Ports renderDetections()'s resolved-vehicles branch (unified-grid-v2.html ~line 5641).
export function VehiclesTable({ vehicles, onTracePlate }: VehiclesTableProps) {
  return (
    <>
      <thead id="detHead">
        <tr>
          <th>Vehicle</th>
          <th>Reads</th>
          <th>Variants merged</th>
          <th>Cameras</th>
          <th>Districts</th>
          <th>First seen</th>
          <th>Last seen</th>
          <th>Mean confidence</th>
          <th>Flag</th>
          <th />
        </tr>
      </thead>
      <tbody id="detBody">
        {vehicles.map((v) => (
          <tr key={v.track_id}>
            <td className="plate">
              <PlateText value={v.plate_display} />
            </td>
            <td className="m">{v.read_count}</td>
            <td className="m variants" title={v.variants_merged.join(', ')}>
              {v.variants_merged.length ? (
                <span className="corr">{v.variants_merged.join(', ')}</span>
              ) : (
                <span className="exact">none</span>
              )}
            </td>
            <td className="m">{v.camera_count}</td>
            <td className="dim wrap">{v.districts_label}</td>
            <td className="m dim">{v.first_seen_str}</td>
            <td className="m dim">{v.last_seen_str}</td>
            <td>
              <ConfidenceBar value={v.mean_confidence} low={v.mean_confidence < 0.85} />
            </td>
            <td>
              <FlagChip flag={v.watchlist_flag} />
            </td>
            <td className="rowbtns">
              <button
                className="navlink"
                onClick={(e) => {
                  e.stopPropagation()
                  onTracePlate(parsePlateDisplay(v.plate_display))
                }}
              >
                <Route size={13} strokeWidth={1.5} />
                Trace
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  )
}
