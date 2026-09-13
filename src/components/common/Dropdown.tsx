import { useEffect, useRef, useState } from 'react'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  id?: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
}

// A div-based single-select, styled and positioned entirely by our own CSS —
// used where a native <select>'s browser/OS-drawn popup renders misaligned
// with its trigger (observed on the detections "Time window" filter).
export function Dropdown({ id, value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const current = options.find((o) => o.value === value)

  return (
    <div className="ddown" id={id} ref={ref}>
      <button
        type="button"
        className="ddown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current?.label ?? value}</span>
        <span className="cv">▾</span>
      </button>
      {open && (
        <div className="ddown-menu" role="listbox">
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={o.value === value ? 'ddown-item sel' : 'ddown-item'}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              <span className="ddown-check">{o.value === value ? '✓' : ''}</span>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
