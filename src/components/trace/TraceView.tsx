import { useTrace } from '../../hooks/useTrace'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useView } from '../../state/viewStore'
import { buildExportUrl } from '../../lib/buildExportUrl'
import { SightingEvidenceStrip } from './SightingEvidenceStrip'
import { KinematicLegsTable } from './KinematicLegsTable'
import { RejectedCandidatesTable } from './RejectedCandidatesTable'
import { IdentityResolutionPanel } from './IdentityResolutionPanel'
import { NextCamerasPanel } from './NextCamerasPanel'
import { CoverageGapsPanel } from './CoverageGapsPanel'
import { TraceMap } from './TraceMap'

export function TraceView({ active }: { active: boolean }) {
  const [plate] = useTracePlate()
  const { data: trace, isLoading } = useTrace(plate)
  const { setView } = useView()

  const sightings = trace?.sightings ?? []
  const correctedCount = sightings.filter((s) => s.corrected).length

  return (
    <section className={active ? 'view on' : 'view'} id="viewTrace">
      <div className="thead">
        <span className="pl">{plate}</span>
        <div className="sum" id="tSum">
          {trace?.summary && (
            <>
              <div>
                <i>{trace.summary.sightings}</i>
                <s>sightings</s>
              </div>
              <div>
                <i>{trace.summary.path_km_str}</i>
                <s>path length</s>
              </div>
              <div>
                <i>{trace.summary.elapsed_str}</i>
                <s>elapsed</s>
              </div>
              <div>
                <i>{trace.summary.mean_kmh} km/h</i>
                <s>mean over ground</s>
              </div>
              <div>
                <i>{trace.summary.districts}</i>
                <s>districts</s>
              </div>
              {trace.vehicle?.identity_confidence !== undefined && (
                <div>
                  <i>{trace.vehicle.identity_confidence}</i>
                  <s>identity confidence</s>
                </div>
              )}
            </>
          )}
        </div>
        <div className="right">
          <button id="tOnMap" onClick={() => setView('map')}>
            Show on map
          </button>
          <a href={buildExportUrl(`/api/trace/${encodeURIComponent(plate)}/export`, {})} style={{ textDecoration: 'none' }}>
            <button type="button" id="tExport">
              Export movement history
            </button>
          </a>
          <button className="primary" id="tWatch">
            Add to watchlist
          </button>
        </div>
      </div>

      {isLoading && <div style={{ padding: 24, color: 'var(--ink-3)' }}>Loading trace…</div>}

      {!isLoading && !trace?.vehicle && (
        <div style={{ padding: 24, color: 'var(--ink-3)' }}>No sightings found for this plate.</div>
      )}

      {trace?.vehicle && (
        <div className="tgrid">
          <div className="tleft">
            <div className="block">
              <h4>
                Sighting evidence, in order{' '}
                <em id="tEvMeta">
                  {correctedCount} of {sightings.length} corrected before matching
                </em>
              </h4>
              <SightingEvidenceStrip sightings={sightings} />
            </div>

            <div className="block">
              <h4>
                Leg analysis <em>straight-line distance, kinematic gate at {trace.identity?.kinematic_gate_kmh ?? 140} km/h</em>
              </h4>
              <table className="seg">
                <thead>
                  <tr>
                    <th>Leg</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Gap</th>
                    <th>Distance</th>
                    <th>Implied speed</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <KinematicLegsTable legs={trace.legs ?? []} />
              </table>
            </div>

            <div className="block">
              <h4>
                Candidates the engine rejected <em>fuzzy match proposed, physics declined</em>
              </h4>
              <table className="seg">
                <thead>
                  <tr>
                    <th>Read</th>
                    <th>Camera</th>
                    <th>Time</th>
                    <th>Distance from prior</th>
                    <th>Implied speed</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <RejectedCandidatesTable rejected={trace.rejected ?? []} />
              </table>
            </div>
          </div>

          <div className="tright">
            <TraceMap sightings={sightings} active={active} />
            {trace.identity && <IdentityResolutionPanel identity={trace.identity} />}
            <NextCamerasPanel cameras={trace.watch_next ?? []} />
            <CoverageGapsPanel gaps={trace.coverage_gaps ?? []} />
          </div>
        </div>
      )}
    </section>
  )
}
