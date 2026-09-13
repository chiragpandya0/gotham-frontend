import { useEffect, useMemo, useState } from 'react'
import { useDetections } from '../../hooks/useDetections'
import { useDetectionVehicles } from '../../hooks/useDetectionVehicles'
import { useCameras } from '../../hooks/useCameras'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useSearchRequest } from '../../hooks/useSearchRequest'
import { useView } from '../../state/viewStore'
import { buildExportUrl } from '../../lib/buildExportUrl'
import { isPlateQueryEmpty } from '../../lib/plateQuery'
import { DetectionsTable } from './DetectionsTable'
import { VehiclesTable } from './VehiclesTable'
import { Dropdown } from '../common/Dropdown'
import type { PlateQuery, PlateType } from '../../types/domain'

type Mode = 'raw' | 'veh'

const WIN_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '0', label: 'Full day' },
  { value: '1', label: 'Last hour' },
  { value: '3', label: 'Last 3 hours' },
]

export function DetectionsView({ active }: { active: boolean }) {
  const [mode, setMode] = useState<Mode>('raw')
  const [plateType, setPlateType] = useState<PlateType>('STANDARD_STATE')
  const [stateCode, setStateCode] = useState('')
  const [rtoCode, setRtoCode] = useState('')
  const [yearCode, setYearCode] = useState('')
  const [series, setSeries] = useState('')
  const [number, setNumber] = useState('')
  const [isPartial, setIsPartial] = useState(true)
  const [camera, setCamera] = useState('')
  const [district, setDistrict] = useState('')
  const [win, setWin] = useState('all')

  const [, setTracePlate] = useTracePlate()
  const [searchRequest] = useSearchRequest()
  const { setView } = useView()
  const { data: camerasData } = useCameras({})

  // Picks up a search fired from the top bar's Search button and applies its
  // plate segments/partial toggle to this view's own filters — the plate
  // type/segment/partial controls used to live here too, but editing now
  // happens only in the top bar.
  useEffect(() => {
    if (!searchRequest) return
    const { plate, partial } = searchRequest
    setPlateType(plate.plate_type)
    setStateCode(plate.state_code ?? '')
    setRtoCode(plate.rto_code ?? '')
    setYearCode(plate.year_code ?? '')
    setSeries(plate.series ?? '')
    setNumber(plate.number ?? '')
    setIsPartial(partial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRequest])

  const from = useMemo(() => {
    if (win === 'all') return undefined
    if (win === '0') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      return startOfDay.toISOString()
    }
    const hours = Number(win)
    return new Date(Date.now() - hours * 3600_000).toISOString()
  }, [win])

  const plateQuery: PlateQuery = {
    plate_type: plateType,
    state_code: stateCode || undefined,
    rto_code: rtoCode || undefined,
    year_code: yearCode || undefined,
    series: series || undefined,
    number: number || undefined,
  }
  const hasPlateFilter = !isPlateQueryEmpty(plateQuery)

  const params = {
    // plate_type is rejected by the backend unless at least one segment field is set.
    ...(hasPlateFilter ? plateQuery : {}),
    is_partial: isPartial,
    camera: camera ? Number(camera) : undefined,
    district: district || undefined,
    from,
    limit: 120,
  }

  const rawQuery = useDetections(params, mode === 'raw')
  const vehQuery = useDetectionVehicles(params, mode === 'veh')

  const reads = rawQuery.data?.pages.flatMap((p) => p.reads) ?? []
  const vehicles = vehQuery.data?.pages.flatMap((p) => p.vehicles) ?? []

  const activeQuery = mode === 'raw' ? rawQuery : vehQuery
  const kpis = mode === 'raw' ? rawQuery.data?.pages[0]?.kpis : vehQuery.data?.pages[0]?.kpis

  function onTracePlate(plate: PlateQuery) {
    setTracePlate(plate)
    setView('map')
  }

  function onTraceRoute(plate: PlateQuery) {
    setTracePlate(plate)
    setView('trace')
  }

  function clearFilters() {
    setStateCode('')
    setRtoCode('')
    setYearCode('')
    setSeries('')
    setNumber('')
    setCamera('')
    setDistrict('')
    setWin('all')
  }

  const districtOptions = useMemo(
    () => Array.from(new Set((camerasData?.cameras ?? []).map((c) => c.district).filter((d): d is string => !!d))).sort(),
    [camerasData],
  )

  const countLabel =
    mode === 'raw'
      ? `${reads.length} read${reads.length === 1 ? '' : 's'} matched`
      : `${vehicles.length} distinct vehicle${vehicles.length === 1 ? '' : 's'} resolved`

  return (
    <section className={active ? 'view on' : 'view'} id="viewDet">
      <div className="kpis" id="detKpis">
        {kpis && (
          <>
            <div className="kpi">
              <i>{(kpis.reads_in_view ?? 0).toLocaleString()}</i>
              <s>reads in view</s>
            </div>
            <div className="kpi">
              <i>{(kpis.distinct_vehicles ?? 0).toLocaleString()}</i>
              <s>distinct vehicles</s>
            </div>
            <div className="kpi">
              <i>{kpis.cameras_reporting ?? '—'}</i>
              <s>cameras reporting</s>
            </div>
            <div className="kpi">
              <i>{(kpis.mean_confidence ?? 0).toFixed(3)}</i>
              <s>mean OCR confidence</s>
            </div>
            <div className={(kpis.corrected_pct ?? 0) > 15 ? 'kpi warn' : 'kpi'}>
              <i>{kpis.corrected_pct ?? 0}%</i>
              <s>reads corrected by regex</s>
            </div>
            <div className="kpi">
              <i>{kpis.watchlist_hits ?? '—'}</i>
              <s>watchlist hits</s>
            </div>
          </>
        )}
      </div>

      <div className="dq">
        <select id="dCam" value={camera} onChange={(e) => setCamera(e.target.value)}>
          <option value="">All cameras</option>
          {(camerasData?.cameras ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_label ?? c.name}
            </option>
          ))}
        </select>
        <select id="dDist" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">All districts</option>
          {districtOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <Dropdown id="dWin" value={win} onChange={setWin} options={WIN_OPTIONS} />
        <div className="right">
          <button id="dClear" onClick={clearFilters}>
            Clear
          </button>
          <a
            id="dExport"
            href={buildExportUrl('/api/detections/export', params)}
            style={{ textDecoration: 'none' }}
          >
            <button type="button">Export report</button>
          </a>
          <button
            className="primary"
            id="dTrace"
            onClick={() => hasPlateFilter && onTracePlate(plateQuery)}
            disabled={!hasPlateFilter}
          >
            Trace on map
          </button>
        </div>
      </div>

      <div className="modes">
        <button id="mRaw" aria-pressed={mode === 'raw'} onClick={() => setMode('raw')}>
          Raw reads
        </button>
        <button id="mVeh" aria-pressed={mode === 'veh'} onClick={() => setMode('veh')}>
          Resolved vehicles
        </button>
        <span className="fz" id="mCount">
          {activeQuery.isLoading ? 'Loading…' : countLabel}
        </span>
      </div>

      <div className="tablewrap">
        <table className="reg" id="detTable">
          {mode === 'raw' ? (
            <DetectionsTable reads={reads} onShowMap={onTracePlate} onTraceRoute={onTraceRoute} />
          ) : (
            <VehiclesTable vehicles={vehicles} onTracePlate={onTracePlate} />
          )}
        </table>
        {activeQuery.hasNextPage && (
          <div style={{ padding: 14, textAlign: 'center' }}>
            <button
              onClick={() => activeQuery.fetchNextPage()}
              disabled={activeQuery.isFetchingNextPage}
            >
              {activeQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
