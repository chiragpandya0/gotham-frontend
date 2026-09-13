import { useSyncExternalStore } from 'react'
import { searchRequestStore, type SearchRequest } from '../state/searchRequestStore'

export function useSearchRequest(): [SearchRequest | null, (request: SearchRequest) => void] {
  const request = useSyncExternalStore(searchRequestStore.subscribe, searchRequestStore.get, searchRequestStore.get)
  return [request, searchRequestStore.set]
}
