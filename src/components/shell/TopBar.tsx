import { useState, type KeyboardEvent } from 'react'
import { IconSearch } from '../../styles/icons'
import type { Me } from '../../types/domain'
import { useCameras } from '../../hooks/useCameras'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useView } from '../../state/viewStore'
import { AccountMenu } from './AccountMenu'
import { NotificationBell } from './NotificationBell'

export function TopBar({ me }: { me: Me }) {
  // Non-geo call: ?geo=true omits the kpis/adapters block entirely on the
  // real backend. This shares its cache entry with CamerasView's identical
  // call rather than firing a second request.
  const { data: cameras } = useCameras({})
  const [plate, setPlate] = useTracePlate()
  const [draft, setDraft] = useState(plate)
  const { setView } = useView()

  function fireTrace() {
    setPlate(draft)
    setView('map')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') fireTrace()
  }

  const kpis = cameras?.kpis

  return (
    <header className="top">
      <div className="mark">
        <b>Unified Grid</b>
        <span>vehicle trace and alerting</span>
      </div>
      <div className="search">
        <IconSearch />
        <input
          id="q"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Trace a vehicle by registration number"
          spellCheck={false}
        />
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
        <div className="stat" title="detections last 60s">
          <i className={kpis ? undefined : 'load'} id="s4">
            {kpis ? kpis.plates_per_min : '—'}
          </i>
          <s>plates / min</s>
        </div>

        <NotificationBell />

        <AccountMenu me={me} />
      </div>
    </header>
  )
}
