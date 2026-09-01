import { useCameras } from '../../hooks/useCameras'
import { useTrace } from '../../hooks/useTrace'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useLeafletMap } from './useLeafletMap'
import { StopsTimeline } from './StopsTimeline'

export function MapView({ active }: { active: boolean }) {
  const { data: camerasData } = useCameras({ geo: true })
  const [plate] = useTracePlate()
  const { data: trace } = useTrace(plate)

  const cameras = camerasData?.cameras ?? []
  const sightings = trace?.sightings ?? []
  const legs = trace?.legs ?? []

  const { focusOn } = useLeafletMap({ containerId: 'map', cameras, sightings, active })

  const onboarded = camerasData?.kpis?.onboarded
  const districtCount = trace?.summary?.districts

  return (
    <section className={active ? 'view on' : 'view'} id="viewMap">
      <div style={{ position: 'relative', minHeight: 0 }}>
        <div id="map" />
        <div className="maphead">
          <div className="maptitle">
            <b>Statewide camera grid</b>
            {onboarded !== undefined ? `${onboarded} cameras onboarded.` : 'Loading cameras…'}{' '}
            {sightings.length > 0 ? `Trace active across ${sightings.length} sightings.` : ''}
          </div>
          <div className="layers">
            <button className="chip" aria-pressed="true" data-layer="cams">
              Cameras
            </button>
            <button className="chip tr" aria-pressed="true" data-layer="route">
              Route
            </button>
            <button className="chip" aria-pressed="false" data-layer="cover">
              Coverage
            </button>
            <button className="chip" aria-pressed="false" data-layer="labels">
              Labels
            </button>
          </div>
        </div>
        <div className="legend">
          <h4>Reading the grid</h4>
          <div>
            <span className="swatch" style={{ background: '#7fa7bc' }} />
            H.264, properties known
          </div>
          <div>
            <span className="swatch" style={{ background: '#b08bc9' }} />
            H.265, properties known
          </div>
          <div>
            <span className="swatch" style={{ background: '#4c6474' }} />
            Live, properties not reported
          </div>
          <div>
            <span className="swatch" style={{ background: '#4fc3d9' }} />
            Sighting on the active trace
          </div>
          <div>
            <span className="swatch" style={{ background: '#e8a33d' }} />
            Watchlist match fired here
          </div>
        </div>
      </div>

      {trace?.vehicle && (
        <div className="timeline">
          <div className="tlhead">
            <span className="plate">{trace.vehicle.plate_display}</span>
            <span className="meta">
              {trace.vehicle.description} &nbsp;
              {trace.summary && (
                <>
                  <b>{trace.summary.sightings} sightings</b> across{' '}
                  <b>{districtCount} district{districtCount === 1 ? '' : 's'}</b> &nbsp; first{' '}
                  {trace.summary.first_seen_str}, last {trace.summary.last_seen_str}
                </>
              )}
            </span>
            <div className="act">
              <button>Export report</button>
              <button>Add to watchlist</button>
            </div>
          </div>
          <StopsTimeline
            sightings={sightings}
            legs={legs}
            onStopClick={(s) => s.lat !== null && s.lon !== null && focusOn(s.lat, s.lon)}
          />
        </div>
      )}
    </section>
  )
}
