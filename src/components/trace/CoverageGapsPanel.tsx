import type { CoverageGapEntry } from '../../types/domain'

export function CoverageGapsPanel({ gaps }: { gaps: CoverageGapEntry[] }) {
  return (
    <div className="tblock">
      <h4>Coverage gaps on this route</h4>
      <div className="in">
        <div className="watch" id="tGaps">
          {gaps.map((g, i) => (
            <div key={i} className="wrow">
              <b>{g.label}</b>
              <span className="km">{g.km_str}</span>
              <span className="eta" style={{ color: 'var(--signal)' }}>
                {g.note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
