// Constant, shipped with the frontend build — API.md's "Not endpoints" table
// confirms the connector catalogue is not backend data.
export const ADAPTER_CATALOGUE = [
  { name: 'RTSP direct', slug: 'rtsp_direct', kind: 'Open protocol', note: 'Cameras with no VMS in front' },
  { name: 'ONVIF', slug: 'onvif', kind: 'Open standard', note: 'Profile S discovery and streaming' },
  { name: 'VMS Milestone', slug: 'vms_milestone', kind: 'Vendor SDK', note: 'XProtect gateway, read only' },
  { name: 'VMS Hikvision', slug: 'vms_hikvision', kind: 'Vendor SDK', note: 'ISAPI, read only' },
  { name: 'HLS relay', slug: 'hls_relay', kind: 'Fallback', note: 'For sites where 8554 is blocked' },
]

export const CONNECTOR_CATALOGUE = [
  ['RTSP direct', 'installed'],
  ['ONVIF Profile S', 'installed'],
  ['Milestone XProtect', 'installed'],
  ['Hikvision ISAPI', 'installed'],
  ['HLS relay', 'installed'],
  ['Genetec Security Center', 'available'],
  ['Dahua DSS', 'available'],
  ['Axis Camera Station', 'available'],
  ['CP Plus', 'available'],
  ['Matrix SATATYA', 'available'],
  ['Bosch BVMS', 'available'],
  ['ONVIF Profile T', 'available'],
] as const
