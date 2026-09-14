import type { TraceLeg } from '../../types/domain'
import { verdictClass, capitalize } from './legVerdict'

interface KinematicLegsTableProps {
  legs: TraceLeg[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function KinematicLegsTable({ legs, selectedIndex, onSelect }: KinematicLegsTableProps) {
  return (
    <tbody id="tSeg">
      {legs.map((l, i) => (
        <tr
          key={`${l.from_sighting}-${l.to_sighting}`}
          aria-selected={i === selectedIndex}
          onClick={() => onSelect(i)}
        >
          <td className="m dim">{i + 1}</td>
          <td>{l.from_label}</td>
          <td>{l.to_label}</td>
          <td className="m">{l.gap_str}</td>
          <td className="m">{l.km.toFixed(1)} km</td>
          <td className="m">{l.kmh} km/h</td>
          <td>
            <span className={verdictClass(l.verdict)}>
              <i />
              {capitalize(l.verdict)}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
