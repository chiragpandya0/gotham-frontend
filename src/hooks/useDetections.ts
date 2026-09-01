import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk, type DetectionsParams } from '../queryKeys'
import type { DetectionsResponse } from '../types/domain'

export function useDetections(params: DetectionsParams = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: qk.detections(params),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<DetectionsResponse>(`/api/detections${buildQuery({ ...params, cursor: pageParam })}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
  })
}
