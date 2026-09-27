import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { DetectorInstance, DetectorInstanceCreated } from '../types/domain'
import type { DetectorInstanceCreateBody, DetectorInstanceUpdateBody } from '../types/requests'

export function useCreateDetectorInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DetectorInstanceCreateBody) => apiClient.post<DetectorInstanceCreated>('/api/detector-instances', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.detectorInstances() })
    },
  })
}

export function useUpdateDetectorInstance(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: DetectorInstanceUpdateBody) => apiClient.patch<DetectorInstance>(`/api/detector-instances/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.detectorInstances() })
    },
  })
}
