import { useEffect } from 'react'
import { BBoxImage, type NormalizedBBox } from './BBoxImage'

interface ImageLightboxProps {
  src: string
  bbox?: NormalizedBBox | null
  caption?: string
  onClose: () => void
}

export function ImageLightbox({ src, bbox, caption, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close full-size image">
        ×
      </button>
      <BBoxImage
        src={src}
        bbox={bbox}
        fit="contain"
        style={{ width: '100%', height: '100%' }}
        imgStyle={{ width: '100%', height: '100%', display: 'block' }}
        imgClassName="lightbox-img"
        className="lightbox-img-wrap"
        onBackgroundClick={onClose}
      />
      {caption && <div className="lightbox-cap">{caption}</div>}
    </div>
  )
}
