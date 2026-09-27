import { useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useCreateDetectorInstance } from '../../hooks/useDetectorInstanceActions'
import type { DetectorInstanceCreated } from '../../types/domain'

interface AddDetectorInstanceDrawerProps {
  open: boolean
  onClose: () => void
}

// POST /api/detector-instances returns the shared_secret exactly once (see
// DetectorInstanceCreated) — the admin has to copy it into the edge
// instance's own config right now, so a successful create swaps the form
// for a reveal screen instead of just closing the drawer.
export function AddDetectorInstanceDrawer({ open, onClose }: AddDetectorInstanceDrawerProps) {
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [district, setDistrict] = useState('')
  const [created, setCreated] = useState<DetectorInstanceCreated | null>(null)
  const [copied, setCopied] = useState(false)
  const create = useCreateDetectorInstance()

  function reset() {
    setName('')
    setBaseUrl('')
    setDistrict('')
    setCreated(null)
    setCopied(false)
    create.reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleCreate() {
    create.mutate(
      { name: name.trim(), base_url: baseUrl.trim(), district: district.trim() || null },
      { onSuccess: (data) => setCreated(data) },
    )
  }

  async function handleCopy() {
    if (!created) return
    await navigator.clipboard.writeText(created.shared_secret)
    setCopied(true)
  }

  const canCreate = name.trim().length > 0 && baseUrl.trim().length > 0

  return (
    <Drawer
      open={open}
      title="Add edge node"
      onClose={handleClose}
      footer={
        created ? (
          <button className="primary" onClick={handleClose}>
            Done
          </button>
        ) : (
          <>
            <button onClick={handleClose}>Cancel</button>
            <button className="primary" disabled={!canCreate || create.isPending} onClick={handleCreate}>
              {create.isPending ? 'Registering…' : 'Register node'}
            </button>
          </>
        )
      }
    >
      {created ? (
        <div className="step">
          <h5>
            <u>1</u>Node registered
          </h5>
          <div className="in">
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--ink-2)' }}>
              Copy this shared secret into <b>{created.name}</b>'s own configuration now — it won't be shown again.
            </p>
            <label>Shared secret</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={created.shared_secret} onFocus={(e) => e.target.select()} />
              <button type="button" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="step">
          <h5>
            <u>1</u>Edge node details
          </h5>
          <div className="in">
            <div className="f2">
              <div>
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajkot Edge 02" />
              </div>
              <div>
                <label>Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://rajkot-edge-02.example.internal"
                />
              </div>
              <div>
                <label>District</label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Rajkot" />
              </div>
            </div>
            {create.isError && <div style={{ color: 'var(--crit)', fontSize: 12 }}>{create.error.message}</div>}
          </div>
        </div>
      )}
    </Drawer>
  )
}
