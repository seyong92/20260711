import { useState } from 'react'

import type { GalleryContent, NavItem } from '../types/site'
import { LightboxModal } from './LightboxModal'
import { Reveal } from './Reveal'
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
          <Reveal
            key={item.id}
            as="button"
            className="gallery-grid__item"
            delay={40 + index * 40}
            onClick={() => setActiveIndex(index)}
            style={{ aspectRatio: item.ratio }}
          >
            <img src={item.src} alt={item.alt} className="gallery-grid__image" />
          </Reveal>
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
