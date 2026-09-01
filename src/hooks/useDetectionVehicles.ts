import { useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk, type DetectionsParams } from '../queryKeys'
import type { VehiclesResponse } from '../types/domain'

// FRONTEND_INTEGRATION.md confirms this endpoint paginates with the same
// cursor/next_cursor scheme as /api/detections, despite openapi.json (and
// API.md's own example for this endpoint) not showing the param.
export function useDetectionVehicles(params: DetectionsParams = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: qk.detectionVehicles(params),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<VehiclesResponse>(`/api/detections/vehicles${buildQuery({ ...params, cursor: pageParam })}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
  })
}
