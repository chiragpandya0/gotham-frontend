import { API_BASE_URL } from '../config/env'
import { buildQuery } from './buildQuery'

export function buildExportUrl(path: string, params: object): string {
  return `${API_BASE_URL}${path}${buildQuery(params)}`
}
