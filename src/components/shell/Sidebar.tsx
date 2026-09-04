import { DetectionFeed } from './DetectionFeed'
import { WatchlistMiniFeed } from './WatchlistMiniFeed'

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  return (
    <aside className="side">
      <button
        className="side-tab"
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Show live feed panel' : 'Hide live feed panel'}
        title={collapsed ? 'Show live feed panel' : 'Hide live feed panel'}
        onClick={onToggleCollapsed}
      >
        {collapsed ? '<<' : '>>'}
      </button>
      <div className="side-inner">
        <DetectionFeed />
        <WatchlistMiniFeed />
      </div>
    </aside>
  )
}
