import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { DetectionsResponse } from '../types/domain'

type Cache = InfiniteData<DetectionsResponse, string | undefined>

// Flips is_pinned on the cached row and nudges pinned_count so the star and the
// "Pinned (n)" label respond instantly; onSettled refetches to reconcile.
function patchCache(data: Cache | undefined, id: number, pinned: boolean): Cache | undefined {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page, i) => ({
      ...page,
      kpis:
        i === 0 && page.kpis.pinned_count !== undefined
          ? { ...page.kpis, pinned_count: Math.max(0, page.kpis.pinned_count + (pinned ? 1 : -1)) }
          : page.kpis,
      reads: page.reads.map((r) => (r.id === id ? { ...r, is_pinned: pinned } : r)),
    })),
  }
}

export function usePinRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      pinned ? apiClient.put<unknown>(`/api/detections/${id}/pin`) : apiClient.delete<void>(`/api/detections/${id}/pin`),
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: ['detections'] })
      const previous = queryClient.getQueriesData<Cache>({ queryKey: ['detections'] })
      // Pinned-only lists are left to the refetch: a row appearing/vanishing there needs server order.
      for (const [key, data] of previous) {
        const params = key[1] as { pinned?: boolean } | undefined
        if (!params?.pinned) queryClient.setQueryData(key, patchCache(data, id, pinned))
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      for (const [key, data] of ctx?.previous ?? []) queryClient.setQueryData(key, data)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['detections'] }),
  })
}
