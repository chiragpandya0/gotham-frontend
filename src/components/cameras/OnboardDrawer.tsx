import { useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useCameraProbe } from '../../hooks/useCameraProbe'
import { useCreateCamera } from '../../hooks/useCreateCamera'
import { ADAPTER_CATALOGUE } from '../../lib/adapterCatalogue'

const DEPARTMENTS = ['Home', 'Municipal', 'Transport', 'Panchayat', 'Food and Civil Supplies', 'RTO', 'Private, permitted']

interface OnboardDrawerProps {
  open: boolean
  onClose: () => void
}

// Ports openOnboard()/runProbe() (unified-grid-v2.html ~line 5280).
export function OnboardDrawer({ open, onClose }: OnboardDrawerProps) {
  const [adapter, setAdapter] = useState(ADAPTER_CATALOGUE[0]!.slug)
  const [district, setDistrict] = useState(DEPARTMENTS[0]!)
  const [url, setUrl] = useState('rtsp://live.corp8.cloud:8554/stream/31')
  const [name, setName] = useState('Kalupur bridge east')
  const [geo, setGeo] = useState('23.0272, 72.5931')
  const [streamId, setStreamId] = useState('31')

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
        district,
        lat: coords[0],
        lon: coords[1],
        adapter,
        connection: { url },
        is_public_domain: true,
        probe_result: probe.result,
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
              <select id="oDept" value={district} onChange={(e) => setDistrict(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
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
              <input id="oUrl" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div>
              <label>Site name</label>
              <input id="oName" value={name} onChange={(e) => setName(e.target.value)} style={{ fontFamily: 'var(--sans)' }} />
            </div>
            <div>
              <label>Coordinates</label>
              <input id="oGeo" value={geo} onChange={(e) => setGeo(e.target.value)} />
            </div>
            <div>
              <label>Stream id</label>
              <input id="oStreamId" value={streamId} onChange={(e) => setStreamId(e.target.value)} />
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
