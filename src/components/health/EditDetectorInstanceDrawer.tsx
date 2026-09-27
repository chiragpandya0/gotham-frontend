import { useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useUpdateDetectorInstance } from '../../hooks/useDetectorInstanceActions'
import type { DetectorInstance, DetectorInstanceStatus } from '../../types/domain'

interface EditDetectorInstanceDrawerProps {
  open: boolean
  onClose: () => void
  instance: DetectorInstance
}

export function EditDetectorInstanceDrawer({ open, onClose, instance }: EditDetectorInstanceDrawerProps) {
  const [name, setName] = useState(instance.name)
  const [baseUrl, setBaseUrl] = useState(instance.base_url)
  const [district, setDistrict] = useState(instance.district ?? '')
  const [status, setStatus] = useState<DetectorInstanceStatus>(instance.status)
  const update = useUpdateDetectorInstance(instance.id)

  const isDirty =
    name.trim() !== instance.name ||
    baseUrl.trim() !== instance.base_url ||
    (district.trim() || null) !== instance.district ||
    status !== instance.status
  const canSave = isDirty && name.trim().length > 0 && baseUrl.trim().length > 0

  function handleSave() {
    update.mutate(
      { name: name.trim(), base_url: baseUrl.trim(), district: district.trim() || null, status },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <Drawer
      open={open}
      title={`Edit ${instance.name}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!canSave || update.isPending} onClick={handleSave}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="step">
        <h5>
          <u>1</u>Edge node details
        </h5>
        <div className="in">
          <div className="f2">
            <div>
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label>Base URL</label>
              <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label>District</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Rajkot" />
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as DetectorInstanceStatus)}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          {update.isError && <div style={{ color: 'var(--crit)', fontSize: 12 }}>{update.error.message}</div>}
        </div>
      </div>
    </Drawer>
  )
}
