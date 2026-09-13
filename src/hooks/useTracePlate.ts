import { useSyncExternalStore } from 'react'
import { tracePlateStore } from '../state/tracePlateStore'
import type { PlateQuery } from '../types/domain'

export function useTracePlate(): [PlateQuery, (plate: PlateQuery) => void] {
  const plate = useSyncExternalStore(tracePlateStore.subscribe, tracePlateStore.get, tracePlateStore.get)
  return [plate, tracePlateStore.set]
}
