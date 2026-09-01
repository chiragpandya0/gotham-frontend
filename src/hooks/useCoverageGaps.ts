import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { CoverageGaps } from '../types/domain'

export function useCoverageGaps(enabled = true) {
  return useQuery({
    queryKey: qk.coverageGaps(),
    queryFn: () => apiClient.get<CoverageGaps>('/api/coverage/gaps'),
    enabled,
  })
}
