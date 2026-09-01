import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk, type CamerasParams } from '../queryKeys'
import type { CamerasResponse } from '../types/domain'

export function useCameras(params: CamerasParams = {}) {
  return useQuery({
    queryKey: qk.cameras(params),
    queryFn: () => apiClient.get<CamerasResponse>(`/api/cameras${buildQuery(params)}`),
  })
}
