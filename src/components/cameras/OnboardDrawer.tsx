import { useEffect, useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useCameraProbe } from '../../hooks/useCameraProbe'
import { useCreateCamera } from '../../hooks/useCreateCamera'
import { useUpdateCamera } from '../../hooks/useUpdateCamera'
import { useDepartments } from '../../hooks/useDepartments'
import { ADAPTER_CATALOGUE } from '../../lib/adapterCatalogue'
import type { Camera } from '../../types/domain'

type OnboardDrawerProps =
  | { mode?: 'create'; open: boolean; onClose: () => void }
  | { mode: 'edit'; open: boolean; onClose: () => void; camera: Camera }

// Ports openOnboard()/runProbe() (unified-grid-v2.html ~line 5280). Also
// doubles as the "Edit camera" form (PATCH /api/cameras/{id}) — that endpoint
// is deliberately narrower than create (no adapter/connection/stream URLs/
// probe fields, see docs/api-reference.md), so edit mode hides those steps
// entirely rather than pretending they're editable.
export function OnboardDrawer(props: OnboardDrawerProps) {
  const { open, onClose } = props
  const isEdit = props.mode === 'edit'
  const camera = isEdit ? props.camera : null

  const departments = useDepartments()
  const [adapter, setAdapter] = useState(ADAPTER_CATALOGUE[0]!.slug)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [district, setDistrict] = useState(camera?.district ?? '')
  const [url, setUrl] = useState('')
  const [name, setName] = useState(camera?.name ?? '')
  const [geo, setGeo] = useState(camera && camera.lat != null && camera.lon != null ? `${camera.lat}, ${camera.lon}` : '')
  const [streamId, setStreamId] = useState('')
  const [webrtcUrl, setWebrtcUrl] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')
  const [anprEnabled, setAnprEnabled] = useState(camera?.detection?.anpr_enabled ?? true)
  const [faceEnabled, setFaceEnabled] = useState(camera?.detection?.face_enabled ?? false)

  const probe = useCameraProbe()
  const create = useCreateCamera()
  const update = useUpdateCamera(camera?.id ?? 0)

  // Camera.department is a display name, not an id (GET /api/cameras doesn't
  // expose department_id) — resolve it against the department list once it's
  // loaded, rather than leaving the dropdown stuck on "Unassigned".
  useEffect(() => {
    if (!camera?.department || !departments.data) return
    const match = departments.data.departments.find((d) => d.name === camera.department)
    if (match) setDepartmentId(match.id)
  }, [camera, departments.data])

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
    if (!coords) return

    if (isEdit) {
      if (!name.trim()) return
      update.mutate(
        {
          name,
          district: district || null,
          department_id: departmentId,
          lat: coords[0],
          lon: coords[1],
          anpr_enabled: anprEnabled,
          face_enabled: faceEnabled,
        },
        { onSuccess: () => onClose() },
      )
      return
    }

    if (!probe.result) return
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
        anpr_enabled: anprEnabled,
        face_enabled: faceEnabled,
      },
      {
        onSuccess: () => {
          onClose()
          probe.reset()
        },
      },
    )
  }

  const saveDisabled = isEdit
    ? !parseGeo() || !name.trim() || update.isPending
    : !probe.result || create.isPending
  const saveLabel = isEdit ? (update.isPending ? 'Saving…' : 'Save changes') : create.isPending ? 'Adding…' : 'Add to registry'

  return (
    <Drawer
      open={open}
      title={isEdit ? 'Edit camera' : 'Onboard a camera'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" id="oSave" disabled={saveDisabled} onClick={onSave}>
            {saveLabel}
          </button>
        </>
      }
    >
      <div className="step">
        <h5>
          <u>1</u>
          {isEdit ? 'Department and detection' : 'Choose an adapter'}
        </h5>
        <div className="in">
          <div className="f2">
            {!isEdit && (
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
            )}
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
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="oAnpr"
                checked={anprEnabled}
                onChange={(e) => setAnprEnabled(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              ANPR
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="oFace"
                checked={faceEnabled}
                onChange={(e) => setFaceEnabled(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              Face detection
            </label>
          </div>
        </div>
      </div>

      <div className="step">
        <h5>
          <u>2</u>
          {isEdit ? 'Details and location' : 'Endpoint and location'}
        </h5>
        <div className="in">
          <div className="f2">
            {!isEdit && (
              <div>
                <label>Stream endpoint</label>
                <input
                  id="oUrl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="rtsp://live.corp8.cloud:8554/stream/31"
                />
              </div>
            )}
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
            {!isEdit && (
              <div>
                <label>Stream id</label>
                <input id="oStreamId" value={streamId} onChange={(e) => setStreamId(e.target.value)} placeholder="31" />
              </div>
            )}
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
            {!isEdit && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {!isEdit && (
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
      )}
    </Drawer>
  )
}
