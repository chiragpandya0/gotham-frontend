import { Drawer } from '../shell/Drawer'
import { useCoverageGaps } from '../../hooks/useCoverageGaps'
import { buildExportUrl } from '../../lib/buildExportUrl'
import type { CoverageGaps } from '../../types/domain'

interface GapAnalysisDrawerProps {
  open: boolean
  onClose: () => void
}

function largestCorridorOf(gaps: CoverageGaps | undefined) {
  if (!gaps || gaps.corridors.length === 0) return undefined
  return gaps.corridors.reduce((max, c) => (c.km > max.km ? c : max))
}

// Ports openGap() (unified-grid-v2.html ~line 5364).
export function GapAnalysisDrawer({ open, onClose }: GapAnalysisDrawerProps) {
  const { data } = useCoverageGaps(open)
  const largestCorridor = largestCorridorOf(data)

  return (
    <Drawer
      open={open}
      title="Coverage gap analysis"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Close</button>
          <a href={data ? buildExportUrl('/api/coverage/gaps', {}) : undefined} style={{ textDecoration: 'none' }}>
            <button className="primary" type="button">
              Export report
            </button>
          </a>
        </>
      }
    >
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
                <dt>Districts with no camera</dt>
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
    </Drawer>
  )
}
