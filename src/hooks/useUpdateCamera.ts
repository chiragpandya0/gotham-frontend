import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { Camera } from '../types/domain'
import type { UpdateCameraBody } from '../types/requests'

export function useUpdateCamera(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateCameraBody) => apiClient.patch<Camera>(`/api/cameras/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] })
    },
  })
}
