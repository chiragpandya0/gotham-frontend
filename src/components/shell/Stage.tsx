import { useView } from '../../state/viewStore'
import { MapView } from '../map/MapView'
import { AlertsView } from '../alerts/AlertsView'
import { CamerasView } from '../cameras/CamerasView'
import { DetectionsView } from '../detections/DetectionsView'
import { TraceView } from '../trace/TraceView'
import { HealthView } from '../health/HealthView'
import { DepartmentsView } from '../departments/DepartmentsView'

// Ports the mockup's `.view` / `.view.on` toggling (`.view{display:none}`,
// `.view.on{display:grid}` in app.css) — every view stays mounted so state
// isn't lost switching tabs, only the active one's <section> gets "on".
export function Stage() {
  const { view } = useView()

  return (
    <main className="stage">
      <MapView active={view === 'map'} />
      <AlertsView active={view === 'alerts'} />
      <CamerasView active={view === 'cams'} />
      <DetectionsView active={view === 'det'} />
      <TraceView active={view === 'trace'} />
      <HealthView active={view === 'health'} />
      <DepartmentsView active={view === 'dept'} />
    </main>
  )
}
