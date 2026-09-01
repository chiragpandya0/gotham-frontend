import { useMemo, useState } from 'react'
import { useCameras } from '../../hooks/useCameras'
import { useMe } from '../../hooks/useMe'
import { usePreviewSessions } from '../../hooks/usePreviewSessions'
import { MAX_PREVIEW_SESSIONS } from '../../state/previewSessionsStore'
import { AdapterStrip } from './AdapterStrip'
import { RegistryTable } from './RegistryTable'
import { OnboardDrawer } from './OnboardDrawer'
import { GapAnalysisDrawer } from './GapAnalysisDrawer'
import { BulkImportDrawer } from './BulkImportDrawer'

type DrawerKind = 'onboard' | 'gap' | 'bulk' | null

export function CamerasView({ active }: { active: boolean }) {
  const { data } = useCameras({})
  const { data: me } = useMe()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [adapter, setAdapter] = useState('')
  const [health, setHealth] = useState('')
  const [drawer, setDrawer] = useState<DrawerKind>(null)
  const { count: previewCount } = usePreviewSessions()

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

  return (
    <section className={active ? 'view on' : 'view'} id="viewCams">
      <AdapterStrip adapters={adapters} />

      <div className="ctools">
        <input
          id="cSearch"
          placeholder="Filter by name, district or endpoint"
          spellCheck={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select id="fDept" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select id="fAdapter" value={adapter} onChange={(e) => setAdapter(e.target.value)}>
          <option value="">All adapters</option>
          {adapterOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select id="fHealth" value={health} onChange={(e) => setHealth(e.target.value)}>
          <option value="">Any health</option>
          <option value="live">Live</option>
          <option value="deg">Degraded</option>
          <option value="rec">Reconnecting</option>
        </select>
        <div className="right">
          <span className="sesscount" id="sessCount">
            <b>{previewCount}</b> of {MAX_PREVIEW_SESSIONS} preview streams open
          </span>
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
            </tr>
          </thead>
          <RegistryTable cameras={filtered} />
        </table>
      </div>

      <OnboardDrawer open={drawer === 'onboard'} onClose={() => setDrawer(null)} />
      <GapAnalysisDrawer open={drawer === 'gap'} onClose={() => setDrawer(null)} />
      <BulkImportDrawer open={drawer === 'bulk'} onClose={() => setDrawer(null)} />
    </section>
  )
}
