import { useState, type KeyboardEvent } from 'react'
import type { PlateType } from '../../types/domain'
import { useTraceTarget } from '../../hooks/useTraceTarget'
import { useSearchRequest } from '../../hooks/useSearchRequest'
import { useView } from '../../state/viewStore'
import { PlateSegmentInput, type PlateSegmentValue } from '../common/PlateSegmentInput'
import { NotificationBell } from './NotificationBell'

export function TopBar() {
  const [target] = useTraceTarget()
  // A detection-id-originated trace has no typed plate to prefill the
  // search box from — fall back to an empty standard-state query, same as
  // the store's own initial value.
  const plate = target.kind === 'plate' ? target.plate : { plate_type: 'STANDARD_STATE' as const }
  const [, setSearchRequest] = useSearchRequest()
  const [draftType, setDraftType] = useState<PlateType>(plate.plate_type)
  const [draftSeg, setDraftSeg] = useState<PlateSegmentValue>({
    state_code: plate.state_code,
    rto_code: plate.rto_code,
    year_code: plate.year_code,
    series: plate.series,
    number: plate.number,
  })
  const [partial, setPartial] = useState(false)
  const { setView } = useView()

  function fireSearch() {
    setSearchRequest({ plate: { plate_type: draftType, ...draftSeg }, partial })
    setView('det')
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') fireSearch()
  }

  return (
    <header className="top">
      <div className="mark">
        <b>Gotham</b>
        <span>Sentinel</span>
      </div>
      <div className="searchbar">
        <div className="search" onKeyDown={onKeyDown}>
          <select
            className="type-select"
            aria-label="Plate type"
            value={draftType}
            onChange={(e) => {
              setDraftType(e.target.value as PlateType)
              setDraftSeg({})
            }}
          >
            <option value="STANDARD_STATE">Standard</option>
            <option value="BH_SERIES">BH</option>
          </select>
          <PlateSegmentInput key={draftType} plateType={draftType} compact initialValue={draftSeg} onChange={setDraftSeg} />
          <button className="go" id="search" onClick={fireSearch}>
            Search
          </button>
        </div>
        <label className="tg">
          <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
          Partial
        </label>
      </div>
      <div className="status">
        <div className="statusRow">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
