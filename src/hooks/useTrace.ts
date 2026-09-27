import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { buildQuery } from '../lib/buildQuery'
import { qk } from '../queryKeys'
import { isPlateQueryEmpty } from '../lib/plateQuery'
import type { TraceTarget } from '../state/tracePlateStore'
import type { TraceResponse } from '../types/domain'

export function useTrace(target: TraceTarget | null) {
  const enabled = target !== null && (target.kind === 'detection' || !isPlateQueryEmpty(target.plate))
  return useQuery({
    queryKey:
      target?.kind === 'detection'
        ? qk.traceByDetection(target.detectionId)
        : qk.trace(target?.kind === 'plate' ? target.plate : { plate_type: 'STANDARD_STATE' }),
    queryFn: () =>
      target?.kind === 'detection'
        ? apiClient.get<TraceResponse>(`/api/trace/${target.detectionId}`)
        : apiClient.get<TraceResponse>(`/api/trace${buildQuery(target?.kind === 'plate' ? target.plate : {})}`),
    enabled,
  })
}
