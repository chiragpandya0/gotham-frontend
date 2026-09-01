import { useView, type ViewId } from '../../state/viewStore'
import { useAlerts } from '../../hooks/useAlerts'
import { IconAlert, IconCam, IconDept, IconDet, IconHealth, IconMap, IconTrace } from '../../styles/icons'

const NAV_ITEMS: { id: ViewId; icon: JSX.Element; label: string }[] = [
  { id: 'map', icon: <IconMap />, label: 'Map overview' },
  { id: 'alerts', icon: <IconAlert />, label: 'Alert console' },
  { id: 'cams', icon: <IconCam />, label: 'Cameras and adapters' },
  { id: 'det', icon: <IconDet />, label: 'Plate detections' },
  { id: 'trace', icon: <IconTrace />, label: 'Route trace' },
  { id: 'health', icon: <IconHealth />, label: 'Grid health' },
  { id: 'dept', icon: <IconDept />, label: 'Departments' },
]

export function Rail() {
  const { view, setView } = useView()
  const { data: alertsData } = useAlerts()
  const active = alertsData?.counts.active

  return (
    <nav className="rail" aria-label="Sections">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          data-view={item.id}
          aria-current={view === item.id ? 'true' : undefined}
          onClick={() => setView(item.id)}
        >
          {item.icon}
          {item.id === 'alerts' && !!active && (
            <span className="badge" id="badge">
              {active}
            </span>
          )}
          <span className="tip">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
