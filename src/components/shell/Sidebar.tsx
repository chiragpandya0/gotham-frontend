import { PanelRightClose, PanelRightOpen } from 'lucide-react'
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
        {collapsed ? <PanelRightOpen size={14} strokeWidth={1.5} /> : <PanelRightClose size={14} strokeWidth={1.5} />}
      </button>
      <div className="side-inner">
        <DetectionFeed />
        <WatchlistMiniFeed />
      </div>
    </aside>
  )
}
