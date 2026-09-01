import { Drawer } from '../shell/Drawer'
import { NotImplementedNotice } from '../common/NotImplementedNotice'

interface BulkImportDrawerProps {
  open: boolean
  onClose: () => void
}

// POST /api/cameras/bulk is explicitly deferred (FRONTEND_INTEGRATION.md
// §5) — this stays structurally ready, gated behind a clear notice instead
// of a working upload flow.
export function BulkImportDrawer({ open, onClose }: BulkImportDrawerProps) {
  return (
    <Drawer
      open={open}
      title="Bulk import"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled>
            Import
          </button>
        </>
      }
    >
      <div className="step">
        <h5>
          <u>1</u>Upload
        </h5>
        <div className="in">
          <NotImplementedNotice what="Bulk camera import" />
        </div>
      </div>
    </Drawer>
  )
}
