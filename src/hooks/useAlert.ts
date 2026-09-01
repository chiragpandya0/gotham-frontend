import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { qk } from '../queryKeys'
import type { AlertDetail } from '../types/domain'

export function useAlert(id: number | null) {
  return useQuery({
    queryKey: qk.alert(id ?? -1),
    queryFn: () => apiClient.get<AlertDetail>(`/api/alerts/${id}`),
    enabled: id !== null,
  })
}
