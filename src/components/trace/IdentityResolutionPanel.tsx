import type { TraceResponse } from '../../types/domain'

export function IdentityResolutionPanel({ identity }: { identity: NonNullable<TraceResponse['identity']> }) {
  return (
    <div className="tblock">
      <h4>How this identity was resolved</h4>
      <div className="in">
        <dl className="kv" id="tIdent">
          <dt>Reads merged</dt>
          <dd>{identity.reads_merged}</dd>
          <dt>Corrected first</dt>
          <dd>{identity.corrected_first}</dd>
          <dt>Candidates rejected</dt>
          <dd className="warn">{identity.candidates_rejected}</dd>
          <dt>Match method</dt>
          <dd>{identity.match_method}</dd>
          <dt>Max edit distance</dt>
          <dd>{identity.max_edit_distance}</dd>
          <dt>Kinematic gate</dt>
          <dd>{identity.kinematic_gate_kmh} km/h</dd>
          <dt>Mean OCR confidence</dt>
          <dd>{identity.mean_confidence.toFixed(2)}</dd>
        </dl>
        <div className="src" id="tIdentNote">
          {identity.note}
        </div>
      </div>
    </div>
  )
}
