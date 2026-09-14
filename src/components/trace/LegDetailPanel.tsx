import type { TraceLeg } from '../../types/domain'
import { verdictClass, capitalize } from './legVerdict'

export function LegDetailPanel({ leg, index }: { leg: TraceLeg; index: number }) {
  return (
    <div className="tblock">
      <h4>Leg {index + 1} detail</h4>
      <div className="in">
        <dl className="kv" id="tIdent">
          <dt>From</dt>
          <dd>{leg.from_label}</dd>
          <dt>To</dt>
          <dd>{leg.to_label}</dd>
          <dt>Gap</dt>
          <dd>{leg.gap_str}</dd>
          <dt>Distance</dt>
          <dd>{leg.km.toFixed(1)} km</dd>
          <dt>Implied speed</dt>
          <dd>{leg.kmh} km/h</dd>
          <dt>Verdict</dt>
          <dd>
            <span className={verdictClass(leg.verdict)}>
              <i />
              {capitalize(leg.verdict)}
            </span>
          </dd>
        </dl>
      </div>
    </div>
  )
}
