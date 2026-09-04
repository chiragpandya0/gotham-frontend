import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface HoverThumbnailProps {
  src: string
}

// A fixed-size crop thumbnail that shows the full, uncropped image on hover.
// The preview portals to <body> and is positioned via getBoundingClientRect
// rather than plain CSS, because the thumbnail lives inside a scrollable
// table wrapper (overflow: auto) — an absolutely-positioned child would get
// clipped by that ancestor instead of floating above the row.
export function HoverThumbnail({ src }: HoverThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<{ left: number; top: number } | null>(null)

  function onEnter() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setPreview({ left: rect.left + rect.width / 2, top: rect.top })
  }

  return (
    <div className="mini-thumb" ref={ref} onMouseEnter={onEnter} onMouseLeave={() => setPreview(null)}>
      <img src={src} alt="" />
      {preview &&
        createPortal(
          <div className="thumb-hover-preview" style={{ left: preview.left, top: preview.top }}>
            <img src={src} alt="" />
          </div>,
          document.body,
        )}
    </div>
  )
}
