import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk } from '../queryKeys'
import type { AlertsResponse } from '../types/domain'

export function useAlerts(state: string = 'all') {
  return useQuery({
    queryKey: qk.alerts(state),
    queryFn: () => apiClient.get<AlertsResponse>(`/api/alerts${buildQuery({ state })}`),
    refetchInterval: 10_000, // polling fallback per FRONTEND_INTEGRATION.md — no /api/stream yet
  })
}
