import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  message: ReactNode
  confirmLabel?: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', pending, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h4>{title}</h4>
        <p>{message}</p>
        <div className="modalbtns">
          <button className="btn" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button className="btn primary" onClick={onConfirm} disabled={pending}>
            {pending ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
