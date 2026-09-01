import { useSyncExternalStore } from 'react'
import { selectedAlertStore } from '../state/selectedAlertStore'

export function useSelectedAlert(): [number | null, (id: number | null) => void] {
  const id = useSyncExternalStore(selectedAlertStore.subscribe, selectedAlertStore.get, selectedAlertStore.get)
  return [id, selectedAlertStore.set]
}
