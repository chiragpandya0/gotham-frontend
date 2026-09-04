export interface CamerasParams {
  q?: string
  district?: string
  department?: number
  adapter?: string
  health?: string
  geo?: boolean
}

export interface DetectionsParams {
  plate?: string
  fuzzy?: boolean
  camera?: number
  district?: string
  min_confidence?: number
  from?: string
  to?: string
  limit?: number
}

export interface WatchlistParams {
  list_name?: string
  active?: boolean
  plate?: string
  limit?: number
  offset?: number
}

export const qk = {
  me: () => ['me'] as const,
  cameras: (params: CamerasParams) => ['cameras', params] as const,
  camera: (id: number) => ['camera', id] as const,
  detections: (params: DetectionsParams) => ['detections', params] as const,
  detectionVehicles: (params: DetectionsParams) => ['detectionVehicles', params] as const,
  trace: (plate: string) => ['trace', plate] as const,
  alerts: (state: string) => ['alerts', state] as const,
  alert: (id: number) => ['alert', id] as const,
  coverageGaps: () => ['coverageGaps'] as const,
  healthOverview: () => ['healthOverview'] as const,
  healthSeries: () => ['healthSeries'] as const,
  departments: () => ['departments'] as const,
  watchlist: (params: WatchlistParams) => ['watchlist', params] as const,
}
