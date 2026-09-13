import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk } from '../queryKeys'
import type { AlertsResponse } from '../types/domain'

// Kept live by useAlertsLiveSync patching this same query cache from the
// `alert` stream event — no polling needed once that's mounted.
export function useAlerts(state: string = 'all') {
  return useQuery({
    queryKey: qk.alerts(state),
    queryFn: () => apiClient.get<AlertsResponse>(`/api/alerts${buildQuery({ state })}`),
  })
}
