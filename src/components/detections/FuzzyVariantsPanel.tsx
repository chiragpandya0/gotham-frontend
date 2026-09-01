import type { FuzzyBlock } from '../../types/domain'

export function FuzzyVariantsPanel({ fuzzy }: { fuzzy: FuzzyBlock | null | undefined }) {
  if (!fuzzy || !fuzzy.applied) return <div className="fuzzy" id="fuzzyBox" />

  return (
    <div className="fuzzy on" id="fuzzyBox">
      <h6>Match expansion for {fuzzy.query_display}</h6>
      <div className="vars">
        {fuzzy.variants.map((v, i) => (
          <span key={i} className="var">
            {v.plate_display}
            <s>{v.distance === 0 ? 'exact' : `distance ${v.distance}, camera ${v.camera_id}`}</s>
          </span>
        ))}
      </div>
      <div className="note">
        {fuzzy.confusions_resolved.length > 0 && `Confusions resolved: ${fuzzy.confusions_resolved.join(', ')}. `}
        {fuzzy.note}
      </div>
    </div>
  )
}
