import { useEffect } from 'react'

import type { GalleryItem } from '../types/site'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { Icon } from './icons'

interface LightboxModalProps {
  items: GalleryItem[]
  activeIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export function LightboxModal({
  items,
  activeIndex,
  onClose,
  onPrevious,
  onNext,
}: LightboxModalProps) {
  const item = items[activeIndex]
  useBodyScrollLock(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }

      if (event.key === 'ArrowLeft') {
        onPrevious()
      }

      if (event.key === 'ArrowRight') {
        onNext()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, onNext, onPrevious])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="갤러리 확대 보기">
      <button type="button" className="lightbox__backdrop" onClick={onClose} aria-label="닫기" />
      <div className="lightbox__content">
        <button type="button" className="lightbox__nav" onClick={onPrevious} aria-label="이전 사진">
          <Icon name="arrowLeft" className="lightbox__nav-icon" />
        </button>

        <figure className="lightbox__figure">
          <img src={item.src} alt={item.alt} className="lightbox__image" />
          <figcaption className="lightbox__caption">
            <span>{item.caption ?? item.alt}</span>
            <button type="button" className="lightbox__close" onClick={onClose}>
              닫기
            </button>
          </figcaption>
        </figure>

        <button type="button" className="lightbox__nav" onClick={onNext} aria-label="다음 사진">
          <Icon name="arrowRight" className="lightbox__nav-icon" />
        </button>
      </div>
    </div>
  )
}
