import { useToastAlert } from '../../hooks/useToastAlert'
import { toastAlertStore } from '../../state/toastAlertStore'
import { useSelectedAlert } from '../../hooks/useSelectedAlert'
import { useView } from '../../state/viewStore'

export function Toast() {
  const alert = useToastAlert()
  const [, setSelectedId] = useSelectedAlert()
  const { setView } = useView()

  function openAlert() {
    if (!alert) return
    setSelectedId(alert.id)
    setView('alerts')
    toastAlertStore.dismiss()
  }

  return (
    <div className={alert ? 'toast show' : 'toast'} id="toast">
      <div className="l1">
        <span className="p" id="tPlate">
          {alert?.plate_display}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-2)' }} id="tKind">
          {alert?.kind}
        </span>
      </div>
      <div className="l2" id="tWhere">
        {alert?.camera_label}
      </div>
      <div className="l3">
        <button className="pr" id="tOpen" onClick={openAlert}>
          Open alert
        </button>
        <button id="tDismiss" onClick={() => toastAlertStore.dismiss()}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
