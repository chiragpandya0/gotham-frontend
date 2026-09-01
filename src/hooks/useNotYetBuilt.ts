import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { ApiError } from '../types/api'

// Shared pattern for the routes API.md documents but that aren't wired up
// server-side yet (health/overview, health/series, departments — confirmed
// 404 against the live backend). A missing route degrades to a flag the
// view can render a notice from, instead of an error boundary.
export function useNotYetBuilt<T>(queryKey: readonly unknown[], path: string) {
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return { data: await apiClient.get<T>(path), notImplemented: false as const }
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          return { data: null, notImplemented: true as const }
        }
        throw e
      }
    },
    retry: false,
  })
  return {
    data: query.data?.data ?? null,
    notImplemented: query.data?.notImplemented ?? false,
    isLoading: query.isLoading,
  }
}
