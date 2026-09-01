import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { Camera } from '../types/domain'
import type { CreateCameraBody } from '../types/requests'

export function useCreateCamera() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCameraBody) => apiClient.post<Camera>('/api/cameras', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
    },
  })
}
