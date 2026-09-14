import { useSyncExternalStore } from 'react'
import { watchlistDraftStore, type WatchlistDraftRequest } from '../state/watchlistDraftStore'

export function useWatchlistDraftRequest(): WatchlistDraftRequest | null {
  return useSyncExternalStore(watchlistDraftStore.subscribe, watchlistDraftStore.get, watchlistDraftStore.get)
}
