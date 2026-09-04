import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk, type WatchlistParams } from '../queryKeys'
import type { WatchlistResponse } from '../types/domain'

export function useWatchlist(params: WatchlistParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.watchlist(params),
    queryFn: () => apiClient.get<WatchlistResponse>(`/api/watchlist${buildQuery(params)}`),
    enabled: options.enabled ?? true,
  })
}
