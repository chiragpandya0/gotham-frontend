type Listener = (alert: ToastAlert | null) => void

export interface ToastAlert {
  id: number
  plate_display: string
  kind: string
  camera_label: string
}

const listeners = new Set<Listener>()
let current: ToastAlert | null = null

export const toastAlertStore = {
  show(alert: ToastAlert) {
    current = alert
    for (const l of listeners) l(current)
  },
  dismiss() {
    current = null
    for (const l of listeners) l(current)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): ToastAlert | null {
    return current
  },
}
