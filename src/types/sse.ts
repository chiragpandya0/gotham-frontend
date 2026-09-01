export interface ProbeStepEvent {
  seq: number
  text: string
  state: 'ok' | 'running' | 'warn' | 'error'
}

export interface ProbeResultEvent {
  codec: string | null
  width: number | null
  height: number | null
  declared_fps: number | null
  measured_fps: number | null
  bitrate_kbps: number | null
  note: string
  ready: boolean
}
