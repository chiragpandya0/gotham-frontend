import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { DetectorInstancesResponse } from '../types/domain'

export function useDetectorInstances(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.detectorInstances(),
    queryFn: () => apiClient.get<DetectorInstancesResponse>('/api/detector-instances'),
    enabled: options.enabled,
  })
}
