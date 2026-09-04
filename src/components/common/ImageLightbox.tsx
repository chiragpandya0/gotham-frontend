import { useEffect } from 'react'

interface ImageLightboxProps {
  src: string
  caption?: string
  onClose: () => void
}

export function ImageLightbox({ src, caption, onClose }: ImageLightboxProps) {
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
      <img src={src} alt="" className="lightbox-img" />
      {caption && <div className="lightbox-cap">{caption}</div>}
    </div>
  )
}
