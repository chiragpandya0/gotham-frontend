import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  footer?: ReactNode
  /** Wider panel, for drawers that carry a map or a table. */
  wide?: boolean
  children: ReactNode
}

// No ids here on purpose: the mockup had exactly one <div id="drawer">
// whose content JS swapped in place. We instead mount one component per
// drawer kind, so duplicate ids (invalid HTML, breaks getElementById-style
// targeting) would result from carrying those ids over — CSS here is
// entirely class-driven, so dropping them changes nothing visually.
export function Drawer({ open, title, onClose, footer, wide, children }: DrawerProps) {
  return (
    <div className={`drawer${open ? ' open' : ''}${wide ? ' wide' : ''}`}>
      <div className="dwhead">
        <b>{title}</b>
        <button className="x" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="dwbody">{children}</div>
      <div className="dwfoot">{footer}</div>
    </div>
  )
}
