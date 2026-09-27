import { useSyncExternalStore } from 'react'
import { tracePlateStore, type TraceTarget } from '../state/tracePlateStore'
import type { PlateQuery } from '../types/domain'

export function useTraceTarget(): [TraceTarget, (plate: PlateQuery) => void, (detectionId: number) => void] {
  const target = useSyncExternalStore(tracePlateStore.subscribe, tracePlateStore.get, tracePlateStore.get)
  return [target, tracePlateStore.setPlate, tracePlateStore.setDetection]
}
