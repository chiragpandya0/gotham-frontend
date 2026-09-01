import { useSyncExternalStore } from 'react'
import { tracePlateStore } from '../state/tracePlateStore'

export function useTracePlate(): [string, (plate: string) => void] {
  const plate = useSyncExternalStore(tracePlateStore.subscribe, tracePlateStore.get, tracePlateStore.get)
  return [plate, tracePlateStore.set]
}
