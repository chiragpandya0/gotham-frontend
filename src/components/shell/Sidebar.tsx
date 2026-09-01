import { DetectionFeed } from './DetectionFeed'
import { WatchlistMiniFeed } from './WatchlistMiniFeed'

export function Sidebar() {
  return (
    <aside className="side">
      <DetectionFeed />
      <WatchlistMiniFeed />
    </aside>
  )
}
