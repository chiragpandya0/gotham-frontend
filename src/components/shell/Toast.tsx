export function Toast() {
  // Visibility is driven by the "show" class (mockup slides it in via
  // `transform`), not display:none, so the CSS transition still runs once
  // this is wired to real alert events in a later phase.
  const show = false
  return (
    <div className={show ? 'toast show' : 'toast'} id="toast">
      <div className="l1">
        <span className="p" id="tPlate" />
        <span style={{ fontSize: 11, color: 'var(--ink-2)' }} id="tKind" />
      </div>
      <div className="l2" id="tWhere" />
      <div className="l3">
        <button className="pr" id="tOpen">
          Open alert
        </button>
        <button id="tDismiss">Dismiss</button>
      </div>
    </div>
  )
}
