import { Drawer } from '../shell/Drawer'
import { CoverageMap, STATUS_LABEL } from './CoverageMap'
import { useCoverageGaps } from '../../hooks/useCoverageGaps'
import { buildExportUrl } from '../../lib/buildExportUrl'
import { coverageColors } from '../../styles/tokens'
import type { CoverageGaps } from '../../types/domain'

interface GapAnalysisDrawerProps {
  open: boolean
  onClose: () => void
}

function largestCorridorOf(gaps: CoverageGaps | undefined) {
  if (!gaps || gaps.corridors.length === 0) return undefined
  return gaps.corridors.reduce((max, c) => (c.km > max.km ? c : max))
}

// Worst first, matching the exported CSV.
const STATUS_ORDER = ['no_coverage', 'neighbour_only', 'single_camera', 'multi_camera'] as const

// Ports openGap() (unified-grid-v2.html ~line 5364), plus the coverage map and
// the per-district table that the exported report lists in full.
export function GapAnalysisDrawer({ open, onClose }: GapAnalysisDrawerProps) {
  const { data } = useCoverageGaps(open)
  const largestCorridor = largestCorridorOf(data)
  const districts = [...(data?.districts ?? [])].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name),
  )

  return (
    <Drawer
      open={open}
      wide
      title="Coverage gap analysis"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Close</button>
          <button type="button" disabled={!data?.districts} onClick={() => window.print()}>
            Export PDF
          </button>
          <a href={data?.districts ? buildExportUrl('/api/coverage/gaps/export', {}) : undefined} style={{ textDecoration: 'none' }}>
            <button className="primary" type="button" disabled={!data?.districts}>
              Export report (CSV)
            </button>
          </a>
        </>
      }
    >
      <div className="print-only printmeta">Generated {new Date().toLocaleString()}</div>
      {open && data?.districts && <CoverageMap />}

      <div className="step">
        <h5>
          <u>!</u>Findings
        </h5>
        <div className="in">
          {!data ? (
            <div className="probe">Loading…</div>
          ) : (
            <>
              <dl className="kv">
                <dt>Districts with no camera in reach</dt>
                <dd className="warn">
                  {data.districts_uncovered !== null ? `${data.districts_uncovered} of ${data.districts_total}` : 'not available'}
                </dd>
                <dt>Cameras with unknown properties</dt>
                <dd className="warn">{data.cameras_unprobed}</dd>
                <dt>Single camera districts</dt>
                <dd>{data.single_camera_districts.join(', ') || 'none'}</dd>
                <dt>Largest uncovered corridor</dt>
                <dd>{largestCorridor ? `${largestCorridor.name}, ${largestCorridor.km} km` : '—'}</dd>
              </dl>
              <div className="src">{data.method}</div>
            </>
          )}
        </div>
      </div>

      {districts.length > 0 && (
        <div className="step">
          <h5>
            <u>#</u>All districts
          </h5>
          <div className="in">
            <table className="covtable">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Status</th>
                  <th>Cameras</th>
                  <th>Area covered</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.name}>
                    <td>{d.name}</td>
                    <td>
                      <i className="covdot" style={{ background: coverageColors[d.status] }} />
                      {STATUS_LABEL[d.status]}
                    </td>
                    <td>{d.cameras === 0 ? '—' : `${d.cameras_live}/${d.cameras} live`}</td>
                    <td>{d.coverage_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Drawer>
  )
}
