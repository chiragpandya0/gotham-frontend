import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { AcknowledgeBody, DispatchBody, FalsePositiveBody } from '../types/requests'
import type { AlertDetail } from '../types/domain'

// All three share the same "invalidate everything alert-shaped" settle
// behavior — a 409 (someone else already acted) still needs a refetch so
// the UI shows the real current state, not just success.
function useAlertMutation<TBody>(id: number, action: 'acknowledge' | 'dispatch' | 'false-positive') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TBody) => apiClient.post<AlertDetail>(`/api/alerts/${id}/${action}`, body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.alert(id) })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useAcknowledgeAlert(id: number) {
  return useAlertMutation<AcknowledgeBody>(id, 'acknowledge')
}

export function useDispatchAlert(id: number) {
  return useAlertMutation<DispatchBody>(id, 'dispatch')
}

export function useFalsePositiveAlert(id: number) {
  return useAlertMutation<FalsePositiveBody>(id, 'false-positive')
}
