import { useEffect, useState } from 'react'
import { Drawer } from '../shell/Drawer'
import { useUpdateCamera } from '../../hooks/useUpdateCamera'
import { useDepartments } from '../../hooks/useDepartments'
import type { Camera } from '../../types/domain'

interface EditCameraDrawerProps {
  open: boolean
  onClose: () => void
  camera: Camera
}

// PATCH /api/cameras/{id} is narrowed to department_id only (2026-09-22
// edge/main split) — every other camera attribute (name/district/lat/lon/
// active/anpr_enabled/face_enabled/adapter/connection) is now owned
// one-way by the edge instance that onboarded the camera and would be
// silently reverted by its next bootstrap/re-poll, so this form doesn't
// pretend those are editable.
export function EditCameraDrawer({ open, onClose, camera }: EditCameraDrawerProps) {
  const departments = useDepartments()
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [initialDepartmentId, setInitialDepartmentId] = useState<number | null>(null)
  const update = useUpdateCamera(camera.id)

  // Camera.department is a display name, not an id (GET /api/cameras
  // doesn't expose department_id) — resolve it against the department list
  // once it's loaded, rather than leaving the dropdown stuck on "Unassigned".
  useEffect(() => {
    if (!camera.department || !departments.data) return
    const match = departments.data.departments.find((d) => d.name === camera.department)
    if (match) {
      setDepartmentId(match.id)
      setInitialDepartmentId(match.id)
    }
  }, [camera, departments.data])

  const isDirty = departmentId !== initialDepartmentId

  function onSave() {
    update.mutate({ department_id: departmentId }, { onSuccess: () => onClose() })
  }

  return (
    <Drawer
      open={open}
      title={`Edit ${camera.name}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!isDirty || update.isPending} onClick={onSave}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="step">
        <h5>
          <u>1</u>Owning department
        </h5>
        <div className="in">
          <div className="f2">
            <div>
              <label>Owning department</label>
              <select
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
    </Drawer>
  )
}
