import { useEffect, useState } from 'react'
import { useTrace } from '../../hooks/useTrace'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useView } from '../../state/viewStore'
import { watchlistDraftStore } from '../../state/watchlistDraftStore'
import { buildExportUrl } from '../../lib/buildExportUrl'
import { formatPlateQuery, isPlateQueryEmpty } from '../../lib/plateQuery'
import { SightingEvidenceStrip } from './SightingEvidenceStrip'
import { KinematicLegsTable } from './KinematicLegsTable'
import { RejectedCandidatesTable } from './RejectedCandidatesTable'
import { LegDetailPanel } from './LegDetailPanel'
import { NextCamerasPanel } from './NextCamerasPanel'
import { CoverageGapsPanel } from './CoverageGapsPanel'
import { TraceMap } from './TraceMap'

export function TraceView({ active }: { active: boolean }) {
  const [plate] = useTracePlate()
  const { data: trace, isLoading } = useTrace(plate)
  const { setView } = useView()

  const sightings = trace?.sightings ?? []
  const legs = trace?.legs ?? []
  const correctedCount = sightings.filter((s) => s.corrected).length
  const plateLabel = formatPlateQuery(plate)

  const [selectedLegIdx, setSelectedLegIdx] = useState(0)
  // A fresh trace (new vehicle, or a re-run of the same one) always starts
  // on leg 1 rather than carrying over whichever leg was selected before.
  useEffect(() => {
    setSelectedLegIdx(0)
  }, [trace?.vehicle?.track_id])

  const selectedLeg = legs[selectedLegIdx]
  // The map shows one leg's route at a time, not the whole trip — fall back
  // to every sighting only when there's no leg to narrow to (a single-point
  // trace with nothing to draw a leg between).
  const mapSightings = selectedLeg
    ? sightings.filter((s) => s.sighting_id === selectedLeg.from_sighting || s.sighting_id === selectedLeg.to_sighting)
    : sightings

  function onAddToWatchlist() {
    watchlistDraftStore.request(plate)
    setView('watchlist')
  }

  return (
    <section className={active ? 'view on' : 'view'} id="viewTrace">
      <div className="thead">
        <span className="pl">{plateLabel}</span>
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
          <a href={buildExportUrl('/api/trace/export', plate)} style={{ textDecoration: 'none' }}>
            <button type="button" id="tExport">
              Export movement history
            </button>
          </a>
          <button className="primary" id="tWatch" disabled={isPlateQueryEmpty(plate)} onClick={onAddToWatchlist}>
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
                <KinematicLegsTable legs={legs} selectedIndex={selectedLegIdx} onSelect={setSelectedLegIdx} />
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
            <TraceMap sightings={mapSightings} active={active} />
            {selectedLeg && <LegDetailPanel leg={selectedLeg} index={selectedLegIdx} />}
            <NextCamerasPanel cameras={trace.watch_next ?? []} />
            <CoverageGapsPanel gaps={trace.coverage_gaps ?? []} />
          </div>
        </div>
      )}
    </section>
  )
}
