import type { AdapterRollup } from '../../types/domain'

interface AdapterStripProps {
  adapters: AdapterRollup[]
}

// Ports renderAdapters() (unified-grid-v2.html ~line 4909).
export function AdapterStrip({ adapters }: AdapterStripProps) {
  return (
    <div className="adstrip" id="adstrip">
      {adapters.map((a) => (
        <div key={a.name} className={a.needs_attention ? 'adcard warn' : 'adcard'}>
          <b>{a.name}</b>
          <div className="n">{a.camera_count}</div>
          <div className="u">cameras · {a.kind}</div>
          <div className="bar">
            {(a.health_bar ?? []).map((state, i) => (
              <span key={i} className={state === 'live' ? 'f' : ''} />
            ))}
          </div>
          <div className="h">
            <i />
            {a.needs_attention ? `${a.needs_attention} needing attention` : 'all streaming'}
          </div>
        </div>
      ))}
    </div>
  )
}
