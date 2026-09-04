export interface LoginBody {
  username?: string
  password?: string
  totp?: string
  sso?: string
}

export interface AcknowledgeBody {
  note?: string
}

export interface DispatchBody {
  unit: string
}

export interface FalsePositiveBody {
  reason: string
}

export interface ProbeBody {
  adapter: string
  connection: Record<string, unknown>
  camera_id?: number
}

export interface WatchlistEntryCreateBody {
  list_name: 'stolen_vehicles' | 'wanted_persons' | 'blacklist' | 'suspect'
  plate?: string | null
  subject_ref?: string | null
  source_system?: string
  source_record_id?: string | null
  details?: Record<string, unknown> | null
  priority: 'critical' | 'high' | 'medium'
}

export interface WatchlistEntryUpdateBody {
  list_name?: 'stolen_vehicles' | 'wanted_persons' | 'blacklist' | 'suspect'
  plate?: string | null
  subject_ref?: string | null
  source_system?: string
  source_record_id?: string | null
  details?: Record<string, unknown> | null
  priority?: 'critical' | 'high' | 'medium'
  active?: boolean
}

export interface CreateCameraBody {
  stream_id: string
  name: string
  district?: string
  department_id?: number
  lat: number
  lon: number
  adapter: string
  connection: Record<string, unknown>
  is_public_domain: boolean
  probe_result?: {
    codec?: string | null
    width?: number | null
    height?: number | null
    declared_fps?: number | null
    measured_fps?: number | null
    bitrate_kbps?: number | null
  } | null
}
