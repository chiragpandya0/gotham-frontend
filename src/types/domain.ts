export interface Me {
  id: number
  username: string
  display_name: string
  initials: string
  // Not present in the backend's actual GET /api/me response (confirmed by
  // FRONTEND_INTEGRATION.md's example, which omits it) — API.md's example
  // has it, but that doc is aspirational where the two disagree.
  email?: string
  role: string
  role_label: string
  control_room: string
  permissions: {
    granted: string[]
    denied: string[]
  }
  scope: {
    districts: string[]
    departments: string[]
    camera_count: number
    summary: string
  }
  session: {
    signed_in_at: string
    signed_in_str: string
    expires_at: string
    second_factor: string
    source_ip: string
    network: string
  }
  // Same story as `email` — not in the backend's actual response today.
  classification?: string
  instance?: string
}

export interface CameraHealth {
  state: string // 'live' | 'deg' | 'rec' in practice
  label: string
  last_frame_str: string
  reconnects_24h: number
  decode_errors_24h: number
}

export interface CameraStream {
  webrtc_url?: string | null
  hls_url?: string | null
  poster_url?: string | null
  rtsp_note?: string | null
}

export interface RecentRead {
  plate_display: string
  seen_time_str: string
  confidence: number
}

export interface Camera {
  id: number
  display_label?: string
  name: string
  district?: string
  department?: string | null
  adapter?: string
  // Null for a camera that hasn't been geo-tagged/probed yet — confirmed
  // against live data.
  lat: number | null
  lon: number | null
  codec?: string | null
  codec_label?: string
  resolution?: string | null
  declared_fps?: number | null
  measured_fps?: number | null
  bitrate_kbps?: number | null
  health?: CameraHealth
  stream?: CameraStream
  warnings?: string[]
  recent_reads?: RecentRead[]
}

export interface AdapterRollup {
  name: string
  kind: string
  note: string
  camera_count: number
  healthy: number
  needs_attention: number
  health_bar: string[]
}

export interface CameraKpis {
  onboarded: number
  adapter_types: number
  unprobed: number
  plates_per_min: number
  preview_sessions_max: number
}

export interface CoverageGaps {
  districts_total: number
  // Null when district_boundary reference data hasn't been loaded —
  // confirmed against live data, the `method` field explains why in that case.
  districts_uncovered: number | null
  cameras_unprobed: number
  single_camera_districts: string[]
  corridors: { name: string; km: number; note: string }[]
  method: string
}

export interface CamerasResponse {
  // Both absent entirely when called with ?geo=true — confirmed against
  // live data (API.md's example implies only recent_reads is dropped, but
  // the real backend drops the whole kpis/adapters block too).
  kpis?: CameraKpis
  adapters?: AdapterRollup[]
  cameras: Camera[]
}

// Fields marked nullable after a live crash (`reads_in_view.toLocaleString()`
// on undefined) — not independently curl-confirmed which field(s) the real
// backend omits or nulls, so all are treated as unreliable defensively
// rather than guessing which one it was.
export interface DetectionKpis {
  reads_in_view: number | null
  distinct_vehicles: number | null
  cameras_reporting: number | null
  mean_confidence: number | null
  corrected_pct: number | null
  watchlist_hits: number | null
}

export interface FuzzyVariant {
  plate_display: string
  distance: number
  camera_id: number
  label: string
}

export interface FuzzyBlock {
  applied: boolean
  query_display: string
  query_canon: string
  max_edit_distance: number
  variants: FuzzyVariant[]
  confusions_resolved: string[]
  note: string
}

export interface DetectionRead {
  id: number
  seen_time_str: string
  seen_at: string
  plate_display: string
  plate_raw_display: string
  corrected: boolean
  camera_id: number
  camera_label: string
  district: string
  adapter: string
  confidence: number
  confidence_low: boolean
  crop_url?: string | null
  frame_url?: string | null
  bbox?: { x: number; y: number; w: number; h: number } | null
  watchlist_flag?: string | null
  track_id?: number | null
}

export interface DetectionsResponse {
  kpis: DetectionKpis
  fuzzy?: FuzzyBlock | null
  reads: DetectionRead[]
  next_cursor?: string | null
}

// GET /api/detections?since= (the polling path) confirmed to return only
// `reads` — no kpis/fuzzy block, since it's meant to be cheap and frequent.
export interface DetectionsFeedResponse {
  reads: DetectionRead[]
}

export interface VehicleGroup {
  track_id: number
  plate_display: string
  read_count: number
  variants_merged: string[]
  camera_count: number
  districts: string[]
  districts_label: string
  first_seen_str: string
  last_seen_str: string
  mean_confidence: number
  watchlist_flag?: string | null
}

export interface VehiclesResponse {
  kpis: DetectionKpis
  vehicles: VehicleGroup[]
  next_cursor?: string | null
}

export interface TraceSighting {
  seq: number
  sighting_id: number
  camera_id: number
  camera_label: string
  district: string
  // Null for a sighting at a camera that hasn't been probed/geo-tagged yet —
  // confirmed against live data (3 of 5 cameras on the demo trace).
  lat: number | null
  lon: number | null
  seen_time_str: string
  confidence: number
  plate_raw_display: string
  corrected: boolean
  crop_url?: string | null
  frame_url?: string | null
  watchlist_flag?: string | null
}

// Real shape confirmed against the live backend — diverges from API.md's
// documented example: no seq/km_str/verdict_label, gap_s is seconds, and
// `verdict` is itself free text ("accepted" | "accepted, long unobserved gap").
export interface TraceLeg {
  from_label: string
  to_label: string
  from_sighting: number
  to_sighting: number
  km: number
  gap_s: number
  gap_str: string
  kmh: number
  verdict: string
}

// Real shape confirmed against the live backend — diverges from API.md's
// documented example: plate_raw (not plate_raw_display), reason (not
// verdict_label), no distance_str.
export interface RejectedRead {
  plate_raw: string
  sighting_id: number
  camera_label: string
  seen_time_str: string
  km: number
  kmh: number
  gap_str: string
  reason: string
}

export interface WatchNextCamera {
  camera_id: number
  camera_label: string
  km_str: string
  eta_str: string
}

export interface CoverageGapEntry {
  label: string
  km_str: string
  note: string
}

export interface TraceResponse {
  vehicle: {
    track_id: number
    plate_display: string
    description?: string
    identity_confidence?: number
  } | null
  summary?: {
    sightings: number
    path_km: number
    path_km_str: string
    elapsed_str: string
    mean_kmh: number
    districts: number
    first_seen_str: string
    last_seen_str: string
  }
  sightings: TraceSighting[]
  legs: TraceLeg[]
  rejected: RejectedRead[]
  identity?: {
    reads_merged: number
    corrected_first: number
    candidates_rejected: number
    match_method: string
    max_edit_distance: number
    kinematic_gate_kmh: number
    mean_confidence: number
    note: string
  }
  watch_next: WatchNextCamera[]
  coverage_gaps: CoverageGapEntry[]
}

export interface AlertCounts {
  active: number
  open: number
  acknowledged: number
  dispatched: number
  total_today: number
}

export interface AlertSummary {
  id: number
  plate_display: string
  kind: string
  priority: string
  priority_label: string
  state: string
  state_label: string
  raised_time_str: string
  camera_label: string
  confidence: number
}

export interface AlertsResponse {
  counts: AlertCounts
  alerts: AlertSummary[]
}

export interface AlertEvidence {
  reference: string
  caption: string
  frame_url?: string | null
  crop_url?: string | null
  bbox?: { x: number; y: number; w: number; h: number } | null
  frame_w?: number
  frame_h?: number
  ocr_note: string
}

export interface AlertMatchedRecord {
  source_label: string
  fields: Record<string, string>
  sync_note: string
}

export interface AlertRule {
  name: string
  condition: string
  window: string
  enabled: boolean
}

export interface AlertLocation {
  camera_id: number
  site: string
  district: string
  department?: string | null
  adapter: string
  lat: number | null
  lon: number | null
  coordinates_str: string
}

export interface AuditEntry {
  at: string
  actor: string
  action: string
  detail?: string
}

// available_actions vocabulary per API.md: 'acknowledge' | 'escalate' | 'false_positive'.
// The real mutation endpoint behind "escalate" is POST .../dispatch (body {unit}) —
// there's no separate /escalate route, confirmed by FRONTEND_INTEGRATION.md's built list.
export type AlertActionToken = 'acknowledge' | 'escalate' | 'dispatch' | 'false_positive'

export interface AlertDetail {
  id: number
  plate_display: string
  kind: string
  priority: string
  priority_label: string
  state: string
  state_label: string
  raised_time_str: string
  subtitle: string
  evidence: AlertEvidence
  matched_record: AlertMatchedRecord
  rule: AlertRule
  location: AlertLocation
  audit: AuditEntry[]
  available_actions: AlertActionToken[]
}

// Health/Departments/live-stream/bulk-import are documented in API.md but
// confirmed NOT built yet (FRONTEND_INTEGRATION.md §5, verified live via
// curl — all 404). These types are best-effort from API.md's examples,
// unverified against real data — expect drift once the routes ship.

export interface HealthKpis {
  streams_connected: string
  frames_decoded_per_sec: number
  capture_to_alert_p95_str: string
  gpu_utilisation_pct: number
  ingest_mbps: number
  cameras_unprobed: number
}

export interface HealthBandwidth {
  fleet_size: number
  fleet_size_note: string
  mean_bitrate_kbps: number
  mean_bitrate_note: string
  metadata_kbps_per_camera: number
  central_gbps: number
  edge_gbps: number
  ratio: number
  workings: string
}

export interface PipelineStage {
  name: string
  rate: number
  unit: string
  lag_str: string
  state: string
}

export interface ComputeNode {
  tier: string
  site: string
  cameras: number
  inference_load: string
  uplink: string
  state: string
}

export interface ServiceStatus {
  name: string
  detail: string
  state: string
  value: string
  value_label: string
}

export interface HealthOverview {
  kpis: HealthKpis
  bandwidth: HealthBandwidth
  stages: PipelineStage[]
  nodes: ComputeNode[]
  services: ServiceStatus[]
}

export interface HealthSeriesEntry {
  metric: string
  label: string
  total?: number
  total_str?: string
  latest?: number
  latest_str?: string
  values: number[]
}

export interface HealthSeries {
  window: string
  bucket: string
  points: number
  series: HealthSeriesEntry[]
}

export interface Department {
  id: number
  name: string
  cameras_held: number
  onboarded: number
  progress_pct: number
  progress_str: string
  vms_vendor: string
  vms_declared: boolean
  storage_type: string
  storage_label: string
  retention_days: number
  retention_str: string
  sharing_status: string
  sharing_label: string
  nodal_officer: string
  nodal_assigned: boolean
}

export interface DepartmentsKpis {
  departments_in_scope: number
  cameras_held: number
  cameras_held_note: string
  onboarded: number
  sharing_agreed: number
  vms_undeclared: number
  retention_range_str: string
}

export interface DepartmentRequirement {
  status: 'have' | 'need'
  title: string
  detail: string
}

export interface OnboardingWave {
  wave: number
  departments: string
  rationale: string
  cameras: number
  cameras_str: string
}

export interface DepartmentsResponse {
  kpis: DepartmentsKpis
  departments: Department[]
  requirements: DepartmentRequirement[]
  waves: OnboardingWave[]
}
