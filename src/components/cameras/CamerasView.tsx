import { useMemo, useState } from 'react'
import { useCameras } from '../../hooks/useCameras'
import { useMe } from '../../hooks/useMe'
import { useView } from '../../state/viewStore'
import { mapFocusStore } from '../../state/mapFocusStore'
import { messageToastStore } from '../../state/messageToastStore'
import { AdapterStrip } from './AdapterStrip'
import { RegistryTable } from './RegistryTable'
import { OnboardDrawer } from './OnboardDrawer'
import { GapAnalysisDrawer } from './GapAnalysisDrawer'
import { BulkImportDrawer } from './BulkImportDrawer'
import { Dropdown } from '../common/Dropdown'
import type { Camera } from '../../types/domain'

type DrawerKind = 'onboard' | 'edit' | 'gap' | 'bulk' | null

const HEALTH_OPTIONS = [
  { value: '', label: 'Any health' },
  { value: 'live', label: 'Live' },
  { value: 'deg', label: 'Degraded' },
  { value: 'down', label: 'Down' },
]

export function CamerasView({ active }: { active: boolean }) {
  const { data } = useCameras({})
  const { data: me } = useMe()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [adapter, setAdapter] = useState('')
  const [health, setHealth] = useState('')
  const [drawer, setDrawer] = useState<DrawerKind>(null)
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null)
  const { setView } = useView()

  const cameras = data?.cameras ?? []
  const adapters = data?.adapters ?? []
  // Gate off permissions.granted per FRONTEND_INTEGRATION.md §3, never a
  // hardcoded role check — the backend is the single source of truth for
  // what a user may do.
  const canOnboard = me?.permissions.granted.includes('onboard_camera') ?? false

  const departmentOptions = useMemo(
    () => Array.from(new Set(cameras.map((c) => c.department).filter((d): d is string => !!d))).sort(),
    [cameras],
  )
  const adapterOptions = useMemo(
    () => Array.from(new Set(cameras.map((c) => c.adapter).filter((a): a is string => !!a))).sort(),
    [cameras],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cameras.filter((c) => {
      if (q && !`${c.name} ${c.district ?? ''} ${c.adapter ?? ''}`.toLowerCase().includes(q)) return false
      if (dept && c.department !== dept) return false
      if (adapter && c.adapter !== adapter) return false
      if (health && (c.health?.state ?? '') !== health) return false
      return true
    })
  }, [cameras, search, dept, adapter, health])

  function viewOnMap() {
    const geoTagged = filtered.filter((c) => typeof c.lat === 'number' && typeof c.lon === 'number')
    if (geoTagged.length === 0) {
      messageToastStore.show('Geolocation is missing for these cameras')
      return
    }
    mapFocusStore.focus(geoTagged.map((c) => c.id))
    setView('map')
  }

  return (
    <section className={active ? 'view on' : 'view'} id="viewCams">
      <AdapterStrip adapters={adapters} />

      <div className="ctools">
        <input
          id="cSearch"
          placeholder="Filter by name"
          spellCheck={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dropdown
          id="fDept"
          value={dept}
          onChange={setDept}
          options={[{ value: '', label: 'All departments' }, ...departmentOptions.map((d) => ({ value: d, label: d }))]}
        />
        <Dropdown
          id="fAdapter"
          value={adapter}
          onChange={setAdapter}
          options={[{ value: '', label: 'All adapters' }, ...adapterOptions.map((a) => ({ value: a, label: a }))]}
        />
        <Dropdown id="fHealth" value={health} onChange={setHealth} options={HEALTH_OPTIONS} />
        <div className="right">
          <button id="btnViewMap" onClick={viewOnMap}>
            View on map
          </button>
          <button id="btnGap" onClick={() => setDrawer('gap')}>
            Gap analysis
          </button>
          {canOnboard && (
            <>
              <button id="btnBulk" onClick={() => setDrawer('bulk')}>
                Bulk import CSV
              </button>
              <button className="primary" id="btnAdd" onClick={() => setDrawer('onboard')}>
                Onboard camera
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tablewrap">
        <table className="reg">
          <thead>
            <tr>
              <th />
              <th>Id</th>
              <th>Site</th>
              <th>District</th>
              <th>Department</th>
              <th>Adapter</th>
              <th>Codec</th>
              <th>Resolution</th>
              <th>Frame rate</th>
              <th>Bitrate</th>
              <th>Health</th>
              <th>Last frame</th>
              <th>Reconnects 24 h</th>
              <th>Decode errors</th>
              <th />
            </tr>
          </thead>
          <RegistryTable
            cameras={filtered}
            onEdit={
              canOnboard
                ? (camera) => {
                    setEditingCamera(camera)
                    setDrawer('edit')
                  }
                : undefined
            }
          />
        </table>
      </div>

      <OnboardDrawer open={drawer === 'onboard'} onClose={() => setDrawer(null)} />
      {editingCamera && (
        <OnboardDrawer
          key={editingCamera.id}
          mode="edit"
          camera={editingCamera}
          open={drawer === 'edit'}
          onClose={() => setDrawer(null)}
        />
      )}
      <GapAnalysisDrawer open={drawer === 'gap'} onClose={() => setDrawer(null)} />
      <BulkImportDrawer open={drawer === 'bulk'} onClose={() => setDrawer(null)} />
    </section>
  )
}
