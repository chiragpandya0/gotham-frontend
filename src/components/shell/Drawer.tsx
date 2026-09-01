import type { ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  title: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

// No ids here on purpose: the mockup had exactly one <div id="drawer">
// whose content JS swapped in place. We instead mount one component per
// drawer kind, so duplicate ids (invalid HTML, breaks getElementById-style
// targeting) would result from carrying those ids over — CSS here is
// entirely class-driven, so dropping them changes nothing visually.
export function Drawer({ open, title, onClose, footer, children }: DrawerProps) {
  return (
    <div className={open ? 'drawer open' : 'drawer'}>
      <div className="dwhead">
        <b>{title}</b>
        <button className="x" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="dwbody">{children}</div>
      <div className="dwfoot">{footer}</div>
    </div>
  )
}
