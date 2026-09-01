import { useNotYetBuilt } from './useNotYetBuilt'
import { qk } from '../queryKeys'
import type { HealthSeries } from '../types/domain'

export function useHealthSeries() {
  return useNotYetBuilt<HealthSeries>(qk.healthSeries(), '/api/health/series?metrics=reconnects,decode_errors,plates_per_min')
}
