import type { AdapterRollup } from '../../types/domain'

interface AdapterStripProps {
  adapters: AdapterRollup[]
  onAddConnector?: () => void
}

// Ports renderAdapters() (unified-grid-v2.html ~line 4909).
export function AdapterStrip({ adapters, onAddConnector }: AdapterStripProps) {
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
      <div className="adcard add" onClick={onAddConnector}>
        <div>
          <div style={{ fontSize: 19, lineHeight: 1 }}>+</div>
          <div style={{ fontSize: 11.5, marginTop: 5 }}>Add connector</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>7 available</div>
        </div>
      </div>
    </div>
  )
}
