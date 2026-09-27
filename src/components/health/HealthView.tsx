import { useState } from 'react'
import { useDetectorInstances } from '../../hooks/useDetectorInstances'
import { useMe } from '../../hooks/useMe'
import { formatClockDateTime } from '../../lib/formatTime'
import { AddDetectorInstanceDrawer } from './AddDetectorInstanceDrawer'
import { EditDetectorInstanceDrawer } from './EditDetectorInstanceDrawer'
import type { DetectorInstance, DetectorInstanceStatus } from '../../types/domain'

function statusVerdictClass(status: DetectorInstanceStatus): string {
  switch (status) {
    case 'active':
      return 'verdict ok'
    case 'pending':
      return 'verdict gap'
    case 'error':
      return 'verdict no'
    case 'disabled':
      return 'verdict off'
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function HealthView({ active }: { active: boolean }) {
  const { data: me } = useMe()
  const canViewEdgeNodes = me?.permissions.granted.includes('onboard_camera') ?? false
  const { data: detectorInstances } = useDetectorInstances({ enabled: canViewEdgeNodes })
  const instances = detectorInstances?.instances ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingInstance, setEditingInstance] = useState<DetectorInstance | null>(null)

  return (
    <section className={active ? 'view on' : 'view'} id="viewHealth">
      <div className="hleft">
        {canViewEdgeNodes ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="newbtn" onClick={() => setAddOpen(true)}>
                + Add edge node
              </button>
            </div>
            <div className="block">
              <h4>
                Edge nodes <em>detector instances connected to main</em>
              </h4>
              <table className="seg">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Total cameras</th>
                    <th>Active cameras</th>
                    <th>Last connected</th>
                    <th />
                  </tr>
                </thead>
                <tbody id="hNodes">
                  {instances.map((n) => (
                    <tr key={n.id}>
                      <td className="m dim">{n.id}</td>
                      <td>{n.name}</td>
                      <td className="dim">{n.district ?? '—'}</td>
                      <td>
                        <span className={statusVerdictClass(n.status)}>
                          <i />
                          {capitalize(n.status)}
                        </span>
                      </td>
                      <td className="m">{n.total_camera}</td>
                      <td className="m">{n.active_camera}</td>
                      <td className="m dim">{n.last_connected_at ? formatClockDateTime(n.last_connected_at) : 'Never'}</td>
                      <td className="rowbtns">
                        <button
                          className="rowbtn"
                          onClick={() => {
                            setEditingInstance(n)
                            setEditOpen(true)
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ padding: 16, color: 'var(--ink-3)' }}>You don't have permission to view edge nodes.</div>
        )}
      </div>

      <AddDetectorInstanceDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      {editingInstance && (
        <EditDetectorInstanceDrawer
          key={editingInstance.id}
          instance={editingInstance}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </section>
  )
}
