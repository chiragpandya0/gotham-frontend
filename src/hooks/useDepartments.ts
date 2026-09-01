import { useNotYetBuilt } from './useNotYetBuilt'
import { qk } from '../queryKeys'
import type { DepartmentsResponse } from '../types/domain'

export function useDepartments() {
  return useNotYetBuilt<DepartmentsResponse>(qk.departments(), '/api/departments')
}
