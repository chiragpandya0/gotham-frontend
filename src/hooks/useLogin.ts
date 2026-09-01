import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { authStore } from '../state/authStore'
import { qk } from '../queryKeys'
import type { Me } from '../types/domain'
import type { LoginBody } from '../types/requests'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginBody) =>
      apiClient.post<Me>('/api/auth/login', body, { skipAuthRedirect: true }),
    onSuccess: (me) => {
      authStore.signIn()
      queryClient.setQueryData(qk.me(), me)
    },
  })
}
