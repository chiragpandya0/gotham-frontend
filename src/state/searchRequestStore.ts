import type { PlateQuery } from '../types/domain'

// A search fired from the top bar — routes into the Detections view's own
// plate/partial filters, mirroring tracePlateStore's pub/sub shape but kept
// separate since this drives a search-and-filter flow, not a map trace.
export interface SearchRequest {
  plate: PlateQuery
  partial: boolean
}

type Listener = (request: SearchRequest) => void

const listeners = new Set<Listener>()
let request: SearchRequest | null = null

export const searchRequestStore = {
  set(next: SearchRequest) {
    request = next
    for (const l of listeners) l(request)
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get(): SearchRequest | null {
    return request
  },
}
