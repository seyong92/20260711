import type { LocationContent, NavItem } from '../types/site'
import { SectionHeading } from './SectionHeading'

interface LocationSectionProps {
  section: NavItem
  location: LocationContent
}

export function LocationSection({ section, location }: LocationSectionProps) {
  return (
    <section id={section.sectionId} className="section section--location">
      <SectionHeading title={location.title} subtitle="How To Find Us" />

      <div className="map-card">
        <iframe
          title={`${location.venue} 지도`}
          src={location.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="map-card__frame"
        />
        <img
          src={location.mapFallbackImage.src}
          alt={location.mapFallbackImage.alt}
          className="map-card__fallback"
        />
        <div className="map-card__badge">
          <span>{location.venue}</span>
        </div>
      </div>

      <div className="location-copy">
        <strong>{location.address}</strong>
        {location.directions.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="map-link-grid">
        {location.mapLinks.map((link) => (
          <a
            key={link.provider}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="map-link-card"
          >
            <strong>{link.provider}</strong>
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
