import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { WatchlistEntry } from '../types/domain'
import type { WatchlistEntryCreateBody, WatchlistEntryUpdateBody } from '../types/requests'

export function useCreateWatchlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: WatchlistEntryCreateBody) => apiClient.post<WatchlistEntry>('/api/watchlist', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}

export function useUpdateWatchlistEntry(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: WatchlistEntryUpdateBody) => apiClient.patch<WatchlistEntry>(`/api/watchlist/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })
}
