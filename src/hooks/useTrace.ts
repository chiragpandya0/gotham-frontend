import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk } from '../queryKeys'
import { isPlateQueryEmpty } from '../lib/plateQuery'
import type { PlateQuery, TraceResponse } from '../types/domain'

export function useTrace(plate: PlateQuery | null) {
  return useQuery({
    queryKey: qk.trace(plate ?? { plate_type: 'STANDARD_STATE' }),
    queryFn: () => apiClient.get<TraceResponse>(`/api/trace${buildQuery(plate ?? {})}`),
    enabled: !!plate && !isPlateQueryEmpty(plate),
  })
}
