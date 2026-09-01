import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { authStore } from '../state/authStore'
import { qk } from '../queryKeys'
import type { Me } from '../types/domain'

export function useMe() {
  return useQuery({
    queryKey: qk.me(),
    queryFn: async () => {
      const me = await apiClient.get<Me>('/api/me', { skipAuthRedirect: true })
      authStore.signIn()
      return me
    },
    retry: false,
    staleTime: 60_000, // API.md: /api/me is cached per-session for 60s server-side
  })
}
