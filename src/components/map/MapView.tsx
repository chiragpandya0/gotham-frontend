import { useState } from 'react'
import { useCameras } from '../../hooks/useCameras'
import { useTrace } from '../../hooks/useTrace'
import { useTracePlate } from '../../hooks/useTracePlate'
import { useLeafletMap } from './useLeafletMap'
import { StopsTimeline } from './StopsTimeline'

type LayerMode = 'cameras' | 'route'

export function MapView({ active }: { active: boolean }) {
  const { data: camerasData } = useCameras({ geo: true })
  const [plate] = useTracePlate()
  const { data: trace } = useTrace(plate)
  const [layerMode, setLayerMode] = useState<LayerMode>('route')

  const cameras = camerasData?.cameras ?? []
  const sightings = trace?.sightings ?? []
  const legs = trace?.legs ?? []

  const layersOn = { cams: layerMode === 'cameras', route: layerMode === 'route' }
  const { focusOn, mapStyle } = useLeafletMap({ containerId: 'map', cameras, sightings, active, layersOn })

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

        {trace?.vehicle && (
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
