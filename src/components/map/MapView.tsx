import { useEffect, useRef, useState } from 'react'
import { useCameras } from '../../hooks/useCameras'
import { useTrace } from '../../hooks/useTrace'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useMapFocusRequest } from '../../hooks/useMapFocusRequest'
import { useLeafletMap } from './useLeafletMap'
import { StopsTimeline } from './StopsTimeline'
import { useView } from '../../state/viewStore'

type LayerMode = 'cameras' | 'route'

export function MapView({ active }: { active: boolean }) {
  const { data: camerasData } = useCameras({ geo: true })
  const [plate] = useTracePlate()
  const { data: trace } = useTrace(plate)
  const [layerMode, setLayerMode] = useState<LayerMode>('cameras')
  const focusRequest = useMapFocusRequest()
  const { setView } = useView()
  const appliedFocusToken = useRef<number | null>(null)
  // Seeded from the current plate at mount, not inside the effect below — a
  // ref set during render (rather than "has the effect run yet") survives
  // React 18 StrictMode's double-invoked mount effect, which would otherwise
  // treat the second invocation as a real plate change and jump to Route.
  const lastPlateRef = useRef(plate)

  // A fresh Trace click always sets a new plate object (see TopBar's
  // fireTrace), even when re-running the same plate — so this fires on
  // every trace, snapping the view back to Route from wherever it was left.
  // No-ops on mount (and on StrictMode's extra mount effect) since `plate`
  // hasn't actually changed from the ref seeded above.
  useEffect(() => {
    if (lastPlateRef.current === plate) return
    lastPlateRef.current = plate
    setLayerMode('route')
  }, [plate])

  const cameras = camerasData?.cameras ?? []
  const sightings = trace?.sightings ?? []
  const legs = trace?.legs ?? []

  const layersOn = { cams: layerMode === 'cameras', route: layerMode === 'route' }
  const { focusOn, focusCameras, mapStyle } = useLeafletMap({ containerId: 'map', cameras, sightings, active, layersOn })

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
          <div className="layers">
            <button
              className="chip"
              aria-pressed={layerMode === 'cameras'}
              data-layer="cams"
              onClick={() => setLayerMode('cameras')}
            >
              Cameras
            </button>
            <button
              className="chip tr"
              aria-pressed={layerMode === 'route'}
              data-layer="route"
              onClick={() => setLayerMode('route')}
            >
              Route
            </button>
            <button className="chip" aria-pressed="false" data-layer="cover">
              Coverage
            </button>
          </div>
        </div>

        {trace?.vehicle && layerMode === 'route' && (
          <div className={mapStyle === 'dark' ? 'rtimeline light-card' : 'rtimeline'}>
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
