import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { DetectionFeed } from './DetectionFeed'
import { WatchlistMiniFeed } from './WatchlistMiniFeed'

const DEFAULT_ALERTS_H = 250
const MIN_ALERTS_H = 96
const MIN_FEED_H = 160
const STORAGE_KEY = 'side.alertsHeight'

function loadHeight(): number {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY))
    return v >= MIN_ALERTS_H ? v : DEFAULT_ALERTS_H
  } catch {
    return DEFAULT_ALERTS_H
  }
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const [alertsH, setAlertsH] = useState(loadHeight)
  const innerRef = useRef<HTMLDivElement>(null)

  function clamp(h: number) {
    const total = innerRef.current?.getBoundingClientRect().height ?? 800
    return Math.round(Math.max(MIN_ALERTS_H, Math.min(h, total - MIN_FEED_H)))
  }

  function save(h: number) {
    try {
      localStorage.setItem(STORAGE_KEY, String(h))
    } catch {
      /* storage unavailable: the height just resets on reload */
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !innerRef.current) return
    const bottom = innerRef.current.getBoundingClientRect().bottom
    setAlertsH(clamp(bottom - e.clientY - 4))
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    save(alertsH)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const next = clamp(alertsH + (e.key === 'ArrowUp' ? 24 : -24))
    setAlertsH(next)
    save(next)
  }

  function reset() {
    setAlertsH(DEFAULT_ALERTS_H)
    save(DEFAULT_ALERTS_H)
  }

  return (
    <aside className="side">
      <button
        className="side-tab"
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Show live feed panel' : 'Hide live feed panel'}
        title={collapsed ? 'Show live feed panel' : 'Hide live feed panel'}
        onClick={onToggleCollapsed}
      >
        <span className="grip" aria-hidden="true" />
      </button>
      <div className="side-inner" ref={innerRef} style={{ ['--alerts-h' as string]: `${alertsH}px` }}>
        <DetectionFeed />
        <div
          className="side-split"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize watchlist matches"
          aria-valuenow={alertsH}
          aria-valuemin={MIN_ALERTS_H}
          tabIndex={0}
          title="Drag to resize, double-click to reset"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          onDoubleClick={reset}
        />
        <WatchlistMiniFeed />
      </div>
    </aside>
  )
}
