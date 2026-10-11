import type L from 'leaflet'
import type { TraceSighting } from '../../types/domain'
import { formatClockDateTime } from '../../lib/formatTime'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const POPUP_W = 210
const POPUP_H = 150
// The popup is a fixed window on a frame whose aspect we don't get from the
// trace (cameras are 16:9), so the window's size as a share of the frame is
// derived from that.
const FRAME_ASPECT = 16 / 9
const WIN_W_PER_H = POPUP_W / POPUP_H / FRAME_ASPECT // window width fraction per unit of window height fraction

// Re-frames the capture so the vehicle (or, failing that, the plate) sits in
// the middle of the popup instead of wherever `object-fit: cover` lands, which
// cuts off any vehicle that isn't near the frame's centre. Zooms just enough
// to fit the box with margin, and clamps to the frame so no blank edge shows.
function framedPhoto(src: string, box: { x: number; y: number; w: number; h: number }): string {
  const winW = Math.min(WIN_W_PER_H, Math.max(0.4, box.w / 0.7, box.h * 1.1))
  const winH = winW / WIN_W_PER_H
  const cx = Math.min(1 - winW / 2, Math.max(winW / 2, box.x + box.w / 2))
  const cy = Math.min(1 - winH / 2, Math.max(winH / 2, box.y + box.h / 2))
  return (
    `<div style="position:relative;width:100%;height:${POPUP_H}px;overflow:hidden">` +
    `<img src="${escapeHtml(src)}" alt="" style="position:absolute;left:50%;top:50%;max-width:none;width:${(100 / winW).toFixed(2)}%;` +
    `transform:translate(${(-cx * 100).toFixed(2)}%,${(-cy * 100).toFixed(2)}%)"></div>`
  )
}

// Quick-look card for a hovered/clicked sighting point: the full capture
// (favoring the wide frame over the tight plate crop — the point is
// confirming it's the same vehicle, not re-reading the plate) with just
// time and camera below it, so it reads at a glance without leaving the map.
export function buildSightingPopupHtml(s: TraceSighting, opts: { showSeq?: boolean } = {}): string {
  const img = s.frame_url
  const flagged = !!s.watchlist_flag
  const focus = s.vehicle_bbox ?? s.plate_bbox
  const photo =
    img && focus
      ? framedPhoto(img, focus)
      : img
    ? `<img src="${escapeHtml(img)}" alt="" style="display:block;width:100%;height:150px;object-fit:cover">`
    : `<div style="width:100%;height:150px;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-family:var(--mono);font-size:11px">no image</div>`
  const flag = flagged
    ? `<div style="flex:none;font-size:11px;font-weight:500;color:var(--amber-b);background:var(--amber-t);border-radius:2px;padding:1px 8px;white-space:nowrap;margin-left:8px">${escapeHtml(s.watchlist_flag ?? '')}</div>`
    : ''
  const timeStr = formatClockDateTime(s.seen_at)
  const timeLabel = opts.showSeq ? `${s.seq}&nbsp;·&nbsp;${escapeHtml(timeStr)}` : escapeHtml(timeStr)
  return (
    `<div style="border-radius:3px 3px 0 0;overflow:hidden">${photo}</div>` +
    `<div style="padding:8px 10px 9px">` +
    `<div style="display:flex;align-items:center;justify-content:space-between">` +
    `<span style="font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text)">${timeLabel}</span>` +
    flag +
    `</div>` +
    `<div style="font-size:11px;color:var(--text-3);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.camera_label)}</div>` +
    `</div>`
  )
}

// Binds the hover-preview / click-to-pin popup behavior to a sighting marker
// — shared by the main map and the trace panel's companion map.
export function bindSightingPopup(marker: L.Marker | L.CircleMarker, html: string): void {
  marker.bindPopup(html, { className: 'sighting-popup', closeButton: false, autoClose: false, closeOnClick: false })
  let pinned = false
  marker.on('mouseover', () => marker.openPopup())
  marker.on('mouseout', () => {
    if (!pinned) marker.closePopup()
  })
  marker.on('click', () => {
    pinned = !pinned
    if (pinned) marker.openPopup()
    else marker.closePopup()
  })
}
