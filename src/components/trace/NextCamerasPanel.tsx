import type { WatchNextCamera } from '../../types/domain'

export function NextCamerasPanel({ cameras }: { cameras: WatchNextCamera[] }) {
  return (
    <div className="tblock">
      <h4>Where to watch next</h4>
      <div className="in">
        <div className="watch" id="tWatchList">
          {cameras.map((c) => (
            <div key={c.camera_id} className="wrow">
              <b>{c.camera_label}</b>
              <span className="km">{c.km_str}</span>
              <span className="eta">{c.eta_str}</span>
            </div>
          ))}
        </div>
        <div className="src">
          Projected from last heading and the road network. Cameras are pre-armed so a match
          fires without an operator watching.
        </div>
      </div>
    </div>
  )
}
