import { useSyncExternalStore } from 'react'
import { toastAlertStore, type ToastAlert } from '../state/toastAlertStore'

export function useToastAlert(): ToastAlert | null {
  return useSyncExternalStore(toastAlertStore.subscribe, toastAlertStore.get, toastAlertStore.get)
}
