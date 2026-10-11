import { useCallback, useEffect, useRef, useState } from 'react'

export interface FocusBox {
  x: number
  y: number
  w: number
  h: number
}

interface FramedImageProps {
  src: string
  /** Normalised 0-1 box (vehicle, or plate as a fallback) to keep centred. */
  focus?: FocusBox | null
  alt?: string
}

// Fills its container like `object-fit: cover`, but re-frames around `focus`
// so a vehicle that isn't near the middle of the frame isn't cropped out.
// Zooms just enough to fit the box with margin (never below cover, capped so
// it doesn't turn to mush) and clamps to the image so no blank edge shows.
// Measured from the container and the image's natural size, so it holds for
// any card size or frame aspect.
export function FramedImage({ src, focus, alt = '' }: FramedImageProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [container, setContainer] = useState<{ w: number; h: number } | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)

  const measureImg = useCallback(() => {
    const img = imgRef.current
    if (img?.naturalWidth && img.naturalHeight) setNatural({ w: img.naturalWidth, h: img.naturalHeight })
  }, [])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setContainer({ w: el.clientWidth, h: el.clientHeight })
    measure()
    measureImg()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [src, measureImg])

  let style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
  if (focus && container && natural && container.w && container.h) {
    const cover = Math.max(container.w / natural.w, container.h / natural.h)
    const fit = Math.min((0.7 * container.w) / (focus.w * natural.w), (0.7 * container.h) / (focus.h * natural.h))
    const scale = Math.min(cover * 2.5, Math.max(cover, fit))
    const dw = natural.w * scale
    const dh = natural.h * scale
    const left = Math.min(0, Math.max(container.w - dw, container.w / 2 - (focus.x + focus.w / 2) * dw))
    const top = Math.min(0, Math.max(container.h - dh, container.h / 2 - (focus.y + focus.h / 2) * dh))
    style = { position: 'absolute', maxWidth: 'none', left, top, width: dw, height: dh }
  }

  return (
    <div ref={boxRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img ref={imgRef} src={src} alt={alt} style={style} onLoad={measureImg} />
    </div>
  )
}
