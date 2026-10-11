import { useCallback, useEffect, useRef, useState } from 'react'

export interface NormalizedBBox {
  x: number
  y: number
  w: number
  h: number
}

export interface LabeledBBox extends NormalizedBBox {
  label?: string
  /** Extra class on the box, e.g. to colour a vehicle box differently from a plate box. */
  className?: string
  /** Show a magnifier loupe while the cursor is over this box. */
  magnify?: boolean
}

const LENS_SIZE = 168
const LENS_ZOOM = 4

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
  /** Additional boxes drawn alongside `bbox` (e.g. vehicle + plate). */
  boxes?: (LabeledBBox | null | undefined)[]
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
  boxes,
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
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)

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

  const toRect = (b: NormalizedBBox) =>
    displayRect && {
      x: displayRect.x + b.x * displayRect.w,
      y: displayRect.y + b.y * displayRect.h,
      w: b.w * displayRect.w,
      h: b.h * displayRect.h,
    }
  const boxRect = bbox ? toRect(bbox) : null

  function onMouseMove(e: React.MouseEvent) {
    const container = containerRef.current
    if (!container || !displayRect || !boxes?.some((b) => b?.magnify)) return
    const cRect = container.getBoundingClientRect()
    const px = e.clientX - cRect.left
    const py = e.clientY - cRect.top
    const over = boxes.some((b) => {
      const r = b?.magnify ? toRect(b) : null
      return r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
    })
    setLens(over ? { x: px, y: py } : null)
  }

  // Lens sits up-right of the cursor, flipping to the other side near the container edges.
  const lensPos = (() => {
    const container = containerRef.current
    if (!lens || !container) return null
    const gap = 18
    const left = lens.x + gap + LENS_SIZE > container.clientWidth ? lens.x - gap - LENS_SIZE : lens.x + gap
    const top = lens.y - gap - LENS_SIZE < 0 ? lens.y + gap : lens.y - gap - LENS_SIZE
    return { left, top }
  })()

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', ...style }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setLens(null)}
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
      {boxes?.map((b, i) => {
        const r = b && toRect(b)
        if (!b || !r) return null
        return (
          <div
            key={i}
            className={`bbox-box ${b.className ?? ''}`}
            style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h }}
          >
            {b.label && <span className="bbox-label">{b.label}</span>}
          </div>
        )
      })}
      {lens && lensPos && displayRect && (
        <div
          className="bbox-lens"
          style={{
            left: lensPos.left,
            top: lensPos.top,
            width: LENS_SIZE,
            height: LENS_SIZE,
            backgroundImage: `url("${src}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${displayRect.w * LENS_ZOOM}px ${displayRect.h * LENS_ZOOM}px`,
            backgroundPosition: `${LENS_SIZE / 2 - (lens.x - displayRect.x) * LENS_ZOOM}px ${
              LENS_SIZE / 2 - (lens.y - displayRect.y) * LENS_ZOOM
            }px`,
          }}
        />
      )}
      {boxRect && (
        <div
          className="bbox-box"
          style={{ position: 'absolute', left: boxRect.x, top: boxRect.y, width: boxRect.w, height: boxRect.h }}
        />
      )}
    </div>
  )
}
