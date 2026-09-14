import { useCallback, useEffect, useRef, useState } from 'react'

export interface NormalizedBBox {
  x: number
  y: number
  w: number
  h: number
}

interface PixelRect {
  x: number
  y: number
  w: number
  h: number
}

interface BBoxImageProps {
  src: string
  alt?: string
  bbox?: NormalizedBBox | null
  /** Matches the CSS object-fit the image is rendered with, so the overlay math accounts for cover-cropping/letterboxing. */
  fit: 'cover' | 'contain'
  className?: string
  style?: React.CSSProperties
  imgClassName?: string
  imgStyle?: React.CSSProperties
  /** Fires on a click that lands outside the rendered image (e.g. the letterboxed margin under `fit: contain`). */
  onBackgroundClick?: () => void
}

// Draws a detector bbox (normalised 0-1, per FRONTEND_INTEGRATION.md ~line
// 218) as an absolutely-positioned box over the image. Computed in pixels
// from the image's natural size vs its rendered display rect (tracked
// regardless of whether a bbox is passed, since onBackgroundClick also needs
// it to tell the letterboxed margin from the picture itself) rather than
// plain percentages — `fit: cover` crops and `fit: contain` letterboxes,
// either of which would misplace a naive percentage overlay, and either of
// which can change relative to the container across a resize/zoom, so this
// is recomputed via ResizeObserver rather than measured once.
export function BBoxImage({
  src,
  alt = '',
  bbox,
  fit,
  className,
  style,
  imgClassName,
  imgStyle,
  onBackgroundClick,
}: BBoxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [displayRect, setDisplayRect] = useState<PixelRect | null>(null)

  const recompute = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) {
      setDisplayRect(null)
      return
    }
    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    if (!cw || !ch) return
    const scale = fit === 'cover' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    setDisplayRect({ x: (cw - dw) / 2, y: (ch - dh) / 2, w: dw, h: dh })
  }, [fit])

  useEffect(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img) return
    recompute()
    if (img.complete) recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(container)
    return () => ro.disconnect()
  }, [src, recompute])

  const boxRect =
    bbox && displayRect
      ? {
          x: displayRect.x + bbox.x * displayRect.w,
          y: displayRect.y + bbox.y * displayRect.h,
          w: bbox.w * displayRect.w,
          h: bbox.h * displayRect.h,
        }
      : null

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', ...style }}
      onClick={
        onBackgroundClick
          ? (e) => {
              const container = containerRef.current
              if (!container) return
              const cRect = container.getBoundingClientRect()
              const px = e.clientX - cRect.left
              const py = e.clientY - cRect.top
              const inImage =
                displayRect &&
                px >= displayRect.x &&
                px <= displayRect.x + displayRect.w &&
                py >= displayRect.y &&
                py <= displayRect.y + displayRect.h
              if (!inImage) onBackgroundClick()
            }
          : undefined
      }
    >
      <img ref={imgRef} src={src} alt={alt} className={imgClassName} style={{ objectFit: fit, ...imgStyle }} onLoad={recompute} />
      {boxRect && (
        <div
          className="bbox-box"
          style={{ position: 'absolute', left: boxRect.x, top: boxRect.y, width: boxRect.w, height: boxRect.h }}
        />
      )}
    </div>
  )
}
