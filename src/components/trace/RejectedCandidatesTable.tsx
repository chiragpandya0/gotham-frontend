import type { RejectedRead } from '../../types/domain'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function RejectedCandidatesTable({ rejected }: { rejected: RejectedRead[] }) {
  return (
    <tbody id="tRej">
      {rejected.map((r) => (
        <tr key={r.sighting_id} className="rejected">
          <td className="m strike">{r.plate_raw}</td>
          <td>{r.camera_label}</td>
          <td className="m dim">{r.seen_time_str}</td>
          <td className="m">
            {r.km.toFixed(0)} km in {r.gap_str}
          </td>
          <td className="m">{r.kmh} km/h</td>
          <td>
            <span className="verdict no">
              <i />
              {capitalize(r.reason)}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
