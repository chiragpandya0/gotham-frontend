import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { authStore } from '../state/authStore'
import { qk } from '../queryKeys'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.post<void>('/api/auth/logout'),
    onSettled: () => {
      // Sign out locally regardless of whether the network call succeeded —
      // a failed logout request shouldn't trap the operator in the shell.
      authStore.signOut()
      queryClient.removeQueries({ queryKey: qk.me() })
    },
  })
}
