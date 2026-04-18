import { useState } from 'react'

import type { GalleryContent, NavItem } from '../types/site'
import { LightboxModal } from './LightboxModal'
import { SectionHeading } from './SectionHeading'

interface GallerySectionProps {
  section: NavItem
  gallery: GalleryContent
}

export function GallerySection({ section, gallery }: GallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section id={section.sectionId} className="section section--gallery">
      <SectionHeading title={gallery.title} subtitle={gallery.subtitle} />
      <div className="gallery-grid">
        {gallery.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="gallery-grid__item"
            style={{ aspectRatio: item.ratio }}
            onClick={() => setActiveIndex(index)}
          >
            <img src={item.src} alt={item.alt} className="gallery-grid__image" />
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <LightboxModal
          items={gallery.items}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onPrevious={() =>
            setActiveIndex((current) =>
              current === null ? 0 : (current - 1 + gallery.items.length) % gallery.items.length,
            )
          }
          onNext={() =>
            setActiveIndex((current) =>
              current === null ? 0 : (current + 1) % gallery.items.length,
            )
          }
        />
      ) : null}
    </section>
  )
}
