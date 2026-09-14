import { useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useCameraProbe } from '../../hooks/useCameraProbe'
import { useCreateCamera } from '../../hooks/useCreateCamera'
import { useDepartments } from '../../hooks/useDepartments'
import { ADAPTER_CATALOGUE } from '../../lib/adapterCatalogue'

interface OnboardDrawerProps {
  open: boolean
  onClose: () => void
}

// Ports openOnboard()/runProbe() (unified-grid-v2.html ~line 5280).
export function OnboardDrawer({ open, onClose }: OnboardDrawerProps) {
  const departments = useDepartments()
  const [adapter, setAdapter] = useState(ADAPTER_CATALOGUE[0]!.slug)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [district, setDistrict] = useState('')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [geo, setGeo] = useState('')
  const [streamId, setStreamId] = useState('')
  const [webrtcUrl, setWebrtcUrl] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')

  const probe = useCameraProbe()
  const create = useCreateCamera()

  function parseGeo(): [number, number] | null {
    const parts = geo.split(',').map((s) => Number(s.trim()))
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null
    return [parts[0]!, parts[1]!]
  }

  function onProbe() {
    probe.run(adapter, { url })
  }

  function onSave() {
    const coords = parseGeo()
    if (!coords || !probe.result) return
    create.mutate(
      {
        stream_id: streamId,
        name,
        district: district || null,
        department_id: departmentId,
        lat: coords[0],
        lon: coords[1],
        adapter,
        connection: { url },
        is_public_domain: true,
        probe_result: probe.result,
        webrtc_url: webrtcUrl || null,
        hls_url: hlsUrl || null,
      },
      {
        onSuccess: () => {
          onClose()
          probe.reset()
        },
      },
    )
  }

  return (
    <Drawer
      open={open}
      title="Onboard a camera"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" id="oSave" disabled={!probe.result || create.isPending} onClick={onSave}>
            {create.isPending ? 'Adding…' : 'Add to registry'}
          </button>
        </>
      }
    >
      <div className="step">
        <h5>
          <u>1</u>Choose an adapter
        </h5>
        <div className="in">
          <div className="f2">
            <div>
              <label>Adapter</label>
              <select id="oAd" value={adapter} onChange={(e) => setAdapter(e.target.value)}>
                {ADAPTER_CATALOGUE.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Owning department</label>
              <select
                id="oDept"
                value={departmentId ?? ''}
                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : null)}
                disabled={departments.isLoading}
              >
                <option value="">Unassigned</option>
                {departments.data?.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="step">
        <h5>
          <u>2</u>Endpoint and location
        </h5>
        <div className="in">
          <div className="f2">
            <div>
              <label>Stream endpoint</label>
              <input
                id="oUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="rtsp://live.corp8.cloud:8554/stream/31"
              />
            </div>
            <div>
              <label>Site name</label>
              <input
                id="oName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontFamily: 'var(--sans)' }}
                placeholder="Kalupur bridge east"
              />
            </div>
            <div>
              <label>Coordinates</label>
              <input id="oGeo" value={geo} onChange={(e) => setGeo(e.target.value)} placeholder="23.0272, 72.5931" />
            </div>
            <div>
              <label>Stream id</label>
              <input id="oStreamId" value={streamId} onChange={(e) => setStreamId(e.target.value)} placeholder="31" />
            </div>
            <div>
              <label>District</label>
              <input
                id="oDistrict"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ fontFamily: 'var(--sans)' }}
                placeholder="e.g. Ahmedabad"
              />
            </div>
            <div>
              <label>WebRTC URL</label>
              <input
                id="oWebrtcUrl"
                value={webrtcUrl}
                onChange={(e) => setWebrtcUrl(e.target.value)}
                placeholder="webrtc://live.corp8.cloud/stream/31"
              />
            </div>
            <div>
              <label>HLS URL</label>
              <input
                id="oHlsUrl"
                value={hlsUrl}
                onChange={(e) => setHlsUrl(e.target.value)}
                placeholder="https://live.corp8.cloud/hls/stream/31.m3u8"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="step">
        <h5>
          <u>3</u>Probe and confirm
        </h5>
        <div className="in">
          <div className="probe" id="oProbe">
            {probe.steps.length === 0 && !probe.error && (
              <>Nothing probed yet. The registry will not accept a camera until its stream properties are read from the source.</>
            )}
            {probe.steps.map((s) => (
              <span key={s.seq} className={s.state === 'ok' && s.seq === probe.steps.length && probe.result ? 'ok' : undefined}>
                {s.text}
                <br />
              </span>
            ))}
            {probe.result && <span className="ok">Probe complete. Camera ready to onboard.</span>}
            {probe.error && <span style={{ color: 'var(--crit)' }}>{probe.error}</span>}
          </div>
          <button className="testbtn" onClick={onProbe} disabled={probe.running}>
            {probe.running ? 'Probing…' : probe.result ? 'Probe again' : 'Test connection and probe'}
          </button>
        </div>
      </div>
    </Drawer>
  )
}
