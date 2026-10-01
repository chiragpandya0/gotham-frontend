import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { DetectorInstancesResponse } from '../types/domain'

const PENDING_POLL_MS = 5_000

export function useDetectorInstances(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.detectorInstances(),
    queryFn: () => apiClient.get<DetectorInstancesResponse>('/api/detector-instances'),
    enabled: options.enabled,
    // Edge nodes start 'pending' until the box first checks in; poll while any
    // are still pending so the status flips to active/error without a manual reload.
    refetchInterval: (query) => {
      const instances = query.state.data?.instances
      const hasPending = instances?.some((instance) => instance.status === 'pending') ?? false
      return hasPending ? PENDING_POLL_MS : false
    },
  })
}
