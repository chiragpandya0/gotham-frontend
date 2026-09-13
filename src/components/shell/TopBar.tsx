import { useState, type KeyboardEvent } from 'react'
import { IconSearch } from '../../styles/icons'
import type { Me, PlateType } from '../../types/domain'
import { useCameras } from '../../hooks/useCameras'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useSearchRequest } from '../../hooks/useSearchRequest'
import { useView } from '../../state/viewStore'
import { PlateSegmentInput, type PlateSegmentValue } from '../common/PlateSegmentInput'
import { AccountMenu } from './AccountMenu'
import { NotificationBell } from './NotificationBell'

export function TopBar({ me }: { me: Me }) {
  // Non-geo call: ?geo=true omits the kpis/adapters block entirely on the
  // real backend. This shares its cache entry with CamerasView's identical
  // call rather than firing a second request.
  const { data: cameras } = useCameras({})
  const [plate] = useTracePlate()
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

  const kpis = cameras?.kpis

  return (
    <header className="top">
      <div className="mark">
        <b>Unified Grid</b>
        <span>vehicle trace and alerting</span>
      </div>
      <div className="searchbar">
        <div className="search" onKeyDown={onKeyDown}>
          <IconSearch />
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
        <div className="stat" title="camera_registry">
          <i className={kpis ? undefined : 'load'} id="s1">
            {kpis ? kpis.onboarded : '—'}
          </i>
          <s>cameras onboarded</s>
        </div>
        <NotificationBell />

        <AccountMenu me={me} />
      </div>
    </header>
  )
}
