import { useEffect, useRef } from 'react'
import { streamStore } from '../state/streamStore'
import { toastAlertStore } from '../state/toastAlertStore'

const AUTO_DISMISS_MS = 8000

// Mount once (in Shell). Pops the toast on every newly raised alert
// (action: "raised") from the `alert` stream event — acknowledge/dispatch/
// false_positive actions on existing alerts don't re-trigger it.
export function useAlertToastSync() {
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const unsub = streamStore.subscribe('alert', (e) => {
      if (e.action !== 'raised') return
      toastAlertStore.show({ id: e.id, plate_display: e.plate_display, kind: e.kind, camera_label: e.camera_label })
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => toastAlertStore.dismiss(), AUTO_DISMISS_MS)
    })

    return () => {
      unsub()
      window.clearTimeout(timerRef.current)
    }
  }, [])
}
