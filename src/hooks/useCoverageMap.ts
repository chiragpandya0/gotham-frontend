import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { CoverageMapData } from '../types/domain'

export function useCoverageMap(enabled = true) {
  return useQuery({
    queryKey: qk.coverageMap(),
    queryFn: () => apiClient.get<CoverageMapData>('/api/coverage/map'),
    enabled,
  })
}
