import type { PlateQuery } from '../types/domain'

// A request to open the Watchlist view's "new entry" form pre-filled with a
// plate — fired from Trace view's "Add to watchlist" button, mirroring how
// mapFocusStore drives the Map view's camera framing. `token` increments on
// every call so WatchlistView can tell two requests for the same plate apart
// and re-open the form each time (e.g. cancelling then clicking again).
export interface WatchlistDraftRequest {
  plate: PlateQuery
  token: number
}

type Listener = (request: WatchlistDraftRequest) => void

const listeners = new Set<Listener>()
let nextToken = 1
let request: WatchlistDraftRequest | null = null

export const watchlistDraftStore = {
  request(plate: PlateQuery) {
    request = { plate, token: nextToken++ }
    for (const l of listeners) l(request)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): WatchlistDraftRequest | null {
    return request
  },
}
