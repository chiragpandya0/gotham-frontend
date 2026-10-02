import { useEffect, useRef, useState } from 'react'
import { useCameras } from '../../hooks/useCameras'
import { useTrace } from '../../hooks/useTrace'
import { useTraceTarget } from '../../hooks/useTraceTarget'
import { useMapFocusRequest } from '../../hooks/useMapFocusRequest'
import { useLeafletMap } from './useLeafletMap'
import { StopsTimeline } from './StopsTimeline'
import { useView } from '../../state/viewStore'

type LayerMode = 'cameras' | 'route'

export function MapView({ active }: { active: boolean }) {
  const { data: camerasData } = useCameras({ geo: true })
  const [target] = useTraceTarget()
  const { data: trace } = useTrace(target)
  const [layerMode, setLayerMode] = useState<LayerMode>('cameras')
  const focusRequest = useMapFocusRequest()
  const { setView } = useView()
  const appliedFocusToken = useRef<number | null>(null)
  // Seeded from the current target at mount, not inside the effect below —
  // a ref set during render (rather than "has the effect run yet") survives
  // React 18 StrictMode's double-invoked mount effect, which would otherwise
  // treat the second invocation as a real target change and jump to Route.
  const lastTargetRef = useRef(target)

  // A fresh Trace/Map click always sets a new target object (see TopBar's
  // fireSearch and every "Trace"/"Map" row action), even when re-running the
  // same plate — so this fires on every trace, snapping the view back to
  // Route from wherever it was left. No-ops on mount (and on StrictMode's
  // extra mount effect) since `target` hasn't actually changed from the ref
  // seeded above.
  useEffect(() => {
    if (lastTargetRef.current === target) return
    lastTargetRef.current = target
    setLayerMode('route')
  }, [target])

  const cameras = camerasData?.cameras ?? []
  const sightings = trace?.sightings ?? []
  const legs = trace?.legs ?? []

  const layersOn = { cams: layerMode === 'cameras', route: layerMode === 'route' }
  const { focusOn, focusCameras } = useLeafletMap({ containerId: 'map', cameras, sightings, active, layersOn })

  // Driven by the Cameras registry's "View on map"/row "Map" buttons (via
  // mapFocusStore) — switches to the Cameras layer and frames the requested
  // camera(s) once their coordinates are loaded. Guarded by token so a
  // request isn't re-applied every time `cameras` gets a new array
  // reference from a live-sync patch.
  useEffect(() => {
    if (!focusRequest || cameras.length === 0) return
    if (appliedFocusToken.current === focusRequest.token) return
    appliedFocusToken.current = focusRequest.token
    setLayerMode('cameras')
    setView('map')
    focusCameras(focusRequest.cameraIds)
  }, [focusRequest, cameras, focusCameras, setView])

  return (
    <section className={active ? 'view on' : 'view'} id="viewMap">
      <div style={{ position: 'relative', minHeight: 0 }}>
        <div id="map" />
        <div className="maphead">
          <div className="layers seg2" role="group" aria-label="Map layer">
            <button aria-pressed={layerMode === 'cameras'} data-layer="cams" onClick={() => setLayerMode('cameras')}>
              Cameras
            </button>
            <button
              aria-pressed={layerMode === 'route'}
              data-layer="route"
              disabled={!trace?.vehicle}
              title={trace?.vehicle ? undefined : 'Run a trace to see a route'}
              onClick={() => setLayerMode('route')}
            >
              Route
            </button>
          </div>
        </div>

        {trace?.vehicle && layerMode === 'route' && (
          <div className="rtimeline">
            <div className="rplate">
              <span>{trace.vehicle.plate_display}</span>
              <span className="pri med traced">Traced</span>
            </div>
            <StopsTimeline
              sightings={sightings}
              legs={legs}
              onStopClick={(s) => s.lat !== null && s.lon !== null && focusOn(s.lat, s.lon)}
            />
          </div>
        )}
      </div>
    </section>
  )
}
