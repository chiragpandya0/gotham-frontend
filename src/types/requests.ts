import type { PlateType, WatchlistListName } from './domain'

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

// Same segment shape as detections/trace filtering (PlateQuery) instead of one
// opaque `plate` string — the backend requires the complete set a given
// plate_type needs (state_code/rto_code/number for STANDARD_STATE,
// year_code/series/number for BH_SERIES) when creating/updating.
export interface WatchlistEntryCreateBody {
  list_name: WatchlistListName
  plate_type?: PlateType | null
  state_code?: string | null
  rto_code?: string | null
  year_code?: string | null
  series?: string | null
  number?: string | null
  subject_ref?: string | null
  source_system?: string
  source_record_id?: string | null
  details?: Record<string, unknown> | null
  priority: 'critical' | 'high' | 'medium'
}

export interface WatchlistEntryUpdateBody {
  list_name?: WatchlistListName
  plate_type?: PlateType | null
  state_code?: string | null
  rto_code?: string | null
  year_code?: string | null
  series?: string | null
  number?: string | null
  subject_ref?: string | null
  source_system?: string
  source_record_id?: string | null
  details?: Record<string, unknown> | null
  priority?: 'critical' | 'high' | 'medium'
  active?: boolean
}

// Narrowed 2026-09-22 (edge/main split) — department_id is the only editable
// camera field left. Every other attribute (name/district/lat/lon/active/
// anpr_enabled/face_enabled/adapter/connection) is now owned one-way by the
// edge instance that onboarded the camera and would be silently reverted by
// its next bootstrap/re-poll; there is no longer a create-camera endpoint at
// all (cameras only enter the system via an edge instance's own camera list).
export interface UpdateCameraBody {
  department_id?: number | null
}
