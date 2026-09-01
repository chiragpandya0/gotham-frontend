import { useNotYetBuilt } from './useNotYetBuilt'
import { qk } from '../queryKeys'
import type { HealthOverview } from '../types/domain'

export function useHealthOverview() {
  return useNotYetBuilt<HealthOverview>(qk.healthOverview(), '/api/health/overview')
}
