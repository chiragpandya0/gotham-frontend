import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { TraceResponse } from '../types/domain'

export function useTrace(plate: string | null) {
  return useQuery({
    queryKey: qk.trace(plate ?? ''),
    queryFn: () => apiClient.get<TraceResponse>(`/api/trace/${encodeURIComponent(plate ?? '')}`),
    enabled: !!plate,
  })
}
