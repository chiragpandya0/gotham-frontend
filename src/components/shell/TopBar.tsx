import { useState, type KeyboardEvent } from 'react'
import { IconSearch } from '../../styles/icons'
import type { Me, PlateType } from '../../types/domain'
import { useCameras } from '../../hooks/useCameras'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useView } from '../../state/viewStore'
import { PlateSegmentInput, type PlateSegmentValue } from '../common/PlateSegmentInput'
import { AccountMenu } from './AccountMenu'
import { NotificationBell } from './NotificationBell'

export function TopBar({ me }: { me: Me }) {
  // Non-geo call: ?geo=true omits the kpis/adapters block entirely on the
  // real backend. This shares its cache entry with CamerasView's identical
  // call rather than firing a second request.
  const { data: cameras } = useCameras({})
  const [plate, setPlate] = useTracePlate()
  const [draftType, setDraftType] = useState<PlateType>(plate.plate_type)
  const [draftSeg, setDraftSeg] = useState<PlateSegmentValue>({
    state_code: plate.state_code,
    rto_code: plate.rto_code,
    year_code: plate.year_code,
    series: plate.series,
    number: plate.number,
  })
  const { setView } = useView()

  function fireTrace() {
    setPlate({ plate_type: draftType, ...draftSeg })
    setView('map')
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') fireTrace()
  }

  const kpis = cameras?.kpis

  return (
    <header className="top">
      <div className="mark">
        <b>Unified Grid</b>
        <span>vehicle trace and alerting</span>
      </div>
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
        <button className="go" id="trace" onClick={fireTrace}>
          Trace
        </button>
      </div>
      <div className="status">
        <div className="pulse" title="Ingest healthy" />
        <div className="stat" title="camera_registry">
          <i className={kpis ? undefined : 'load'} id="s1">
            {kpis ? kpis.onboarded : '—'}
          </i>
          <s>cameras onboarded</s>
        </div>
        <div className="stat" title="camera_registry group by adapter">
          <i className={kpis ? undefined : 'load'} id="s2">
            {kpis ? kpis.adapter_types : '—'}
          </i>
          <s>adapter types</s>
        </div>
        <div className="stat" title="camera_registry where codec is null">
          <i className={kpis ? undefined : 'load'} id="s3">
            {kpis ? kpis.unprobed : '—'}
          </i>
          <s>awaiting probe</s>
        </div>
        <NotificationBell />

        <AccountMenu me={me} />
      </div>
    </header>
  )
}
