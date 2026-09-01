import type { TraceLeg } from '../../types/domain'

// verdict is free text from the backend ("accepted" | "accepted, long
// unobserved gap") — no separate verdict/verdict_label pair like API.md's
// aspirational example, confirmed against live data.
function verdictClass(verdict: string): string {
  if (!verdict.startsWith('accepted')) return 'verdict no'
  return verdict.includes('gap') ? 'verdict gap' : 'verdict ok'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function KinematicLegsTable({ legs }: { legs: TraceLeg[] }) {
  return (
    <tbody id="tSeg">
      {legs.map((l, i) => (
        <tr key={`${l.from_sighting}-${l.to_sighting}`}>
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
