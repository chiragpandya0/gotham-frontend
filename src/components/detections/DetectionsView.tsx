import { useMemo, useState } from 'react'
import { useDetections } from '../../hooks/useDetections'
import { useDetectionVehicles } from '../../hooks/useDetectionVehicles'
import { useCameras } from '../../hooks/useCameras'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useView } from '../../state/viewStore'
import { buildExportUrl } from '../../lib/buildExportUrl'
import { isPlateQueryEmpty } from '../../lib/plateQuery'
import { PlateSegmentInput } from '../common/PlateSegmentInput'
import { DetectionsTable } from './DetectionsTable'
import { VehiclesTable } from './VehiclesTable'
import type { PlateQuery, PlateType } from '../../types/domain'

type Mode = 'raw' | 'veh'

export function DetectionsView({ active }: { active: boolean }) {
  const [mode, setMode] = useState<Mode>('raw')
  const [plateType, setPlateType] = useState<PlateType>('STANDARD_STATE')
  const [stateCode, setStateCode] = useState('')
  const [rtoCode, setRtoCode] = useState('')
  const [yearCode, setYearCode] = useState('')
  const [series, setSeries] = useState('')
  const [number, setNumber] = useState('')
  const [plateResetToken, setPlateResetToken] = useState(0)
  const [isPartial, setIsPartial] = useState(true)
  const [camera, setCamera] = useState('')
  const [district, setDistrict] = useState('')
  const [win, setWin] = useState('0')
  const [minConfidence, setMinConfidence] = useState('0.80')

  const [, setTracePlate] = useTracePlate()
  const { setView } = useView()
  const { data: camerasData } = useCameras({})

  const from = useMemo(() => {
    if (win === '0') return undefined
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
    min_confidence: Number(minConfidence) || undefined,
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

  function clearFilters() {
    setStateCode('')
    setRtoCode('')
    setYearCode('')
    setSeries('')
    setNumber('')
    setPlateResetToken((n) => n + 1)
    setCamera('')
    setDistrict('')
    setWin('0')
    setMinConfidence('0.80')
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
        <select
          id="dPlateType"
          value={plateType}
          onChange={(e) => {
            setPlateType(e.target.value as PlateType)
            setStateCode('')
            setRtoCode('')
            setYearCode('')
            setSeries('')
            setNumber('')
          }}
        >
          <option value="STANDARD_STATE">Standard state</option>
          <option value="BH_SERIES">BH series</option>
        </select>
        <PlateSegmentInput
          key={`${plateType}-${plateResetToken}`}
          plateType={plateType}
          compact
          onChange={(seg) => {
            setStateCode(seg.state_code ?? '')
            setRtoCode(seg.rto_code ?? '')
            setYearCode(seg.year_code ?? '')
            setSeries(seg.series ?? '')
            setNumber(seg.number ?? '')
          }}
        />
        <label className="tg">
          <input type="checkbox" id="dPartial" checked={isPartial} onChange={(e) => setIsPartial(e.target.checked)} />
          Partial match
        </label>
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
        <select id="dWin" value={win} onChange={(e) => setWin(e.target.value)}>
          <option value="0">Full day</option>
          <option value="1">Last hour</option>
          <option value="3">Last 3 hours</option>
        </select>
        <input
          className="num"
          id="dConf"
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          title="Minimum confidence"
        />
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
            <DetectionsTable reads={reads} onTracePlate={onTracePlate} />
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
