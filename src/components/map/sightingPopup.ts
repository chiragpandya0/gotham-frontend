import type L from 'leaflet'
import type { TraceSighting } from '../../types/domain'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Quick-look card for a hovered/clicked sighting point: the full capture
// (favoring the wide frame over the tight plate crop — the point is
// confirming it's the same vehicle, not re-reading the plate) with just
// time and camera below it, so it reads at a glance without leaving the map.
export function buildSightingPopupHtml(s: TraceSighting, opts: { showSeq?: boolean } = {}): string {
  const img = s.frame_url
  const flagged = !!s.watchlist_flag
  const timeColor = flagged ? 'var(--signal)' : 'var(--ink)'
  const photo = img
    ? `<img src="${escapeHtml(img)}" alt="" style="display:block;width:100%;height:150px;object-fit:cover">`
    : `<div style="width:100%;height:150px;display:flex;align-items:center;justify-content:center;color:var(--ink-3);font-family:var(--mono);font-size:11px">no image</div>`
  const flag = flagged
    ? `<div style="flex:none;font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.03em;color:#12181c;background:var(--signal);border-radius:2px;padding:2px 6px;white-space:nowrap;margin-left:8px">${escapeHtml(s.watchlist_flag ?? '')}</div>`
    : ''
  const timeLabel = opts.showSeq ? `${s.seq}&nbsp;·&nbsp;${escapeHtml(s.seen_time_str)}` : escapeHtml(s.seen_time_str)
  return (
    `<div style="border-radius:5px 5px 0 0;overflow:hidden">${photo}</div>` +
    `<div style="padding:8px 10px 9px">` +
    `<div style="display:flex;align-items:center;justify-content:space-between">` +
    `<span style="font-family:var(--mono);font-size:13px;font-weight:600;color:${timeColor}">${timeLabel}</span>` +
    flag +
    `</div>` +
    `<div style="font-size:11px;color:var(--ink-3);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(s.camera_label)}</div>` +
    `</div>`
  )
}

// Binds the hover-preview / click-to-pin popup behavior to a sighting marker
// — shared by the main map and the trace panel's companion map.
export function bindSightingPopup(marker: L.CircleMarker, html: string): void {
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
