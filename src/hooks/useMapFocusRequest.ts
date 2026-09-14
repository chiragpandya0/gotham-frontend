import { useSyncExternalStore } from 'react'
import { mapFocusStore, type MapFocusRequest } from '../state/mapFocusStore'

export function useMapFocusRequest(): MapFocusRequest | null {
  return useSyncExternalStore(mapFocusStore.subscribe, mapFocusStore.get, mapFocusStore.get)
}
