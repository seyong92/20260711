import { useEffect, useRef, useState } from 'react'

import type { LocationContent, NavItem } from '../types/site'
import { loadNaverMapScript } from '../lib/naverMap'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

interface LocationSectionProps {
  section: NavItem
  location: LocationContent
}

export function LocationSection({ section, location }: LocationSectionProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapKeyId =
    import.meta.env.VITE_NAVER_MAP_KEY_ID ?? import.meta.env.VITE_NAVER_MAP_CLIENT_ID

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container || !mapKeyId) {
      setMapReady(false)
      setMapError('VITE_NAVER_MAP_KEY_ID is not set')
      return
    }

    let cancelled = false
    setMapError(null)

    loadNaverMapScript(mapKeyId)
      .then(() => {
        if (cancelled || !window.naver?.maps) {
          if (!cancelled) {
            setMapError('NAVER Maps namespace is unavailable after script load')
          }
          return
        }

        try {
          container.innerHTML = ''

          const { lat, lng } = location.coordinates
          const position = new window.naver.maps.LatLng(lat, lng)
          const map = new window.naver.maps.Map(container, {
            center: position,
            zoom: 16,
            zoomControl: true,
            scaleControl: false,
            logoControl: true,
            mapDataControl: false,
          })

          new window.naver.maps.Marker({
            position,
            map,
          })

          setMapReady(true)
          setMapError(null)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.error('NAVER map initialization failed', {
            mapKeyId,
            href: window.location.href,
            error,
          })
          setMapReady(false)
          setMapError(message)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('NAVER map script failed', {
            mapKeyId,
            href: window.location.href,
            error,
          })
          setMapReady(false)
          setMapError(error instanceof Error ? error.message : String(error))
        }
      })

    return () => {
      cancelled = true
    }
  }, [mapKeyId, location.coordinates])

  return (
    <section id={section.sectionId} className="section section--location">
      <SectionHeading title={location.title} subtitle="How To Find Us" />

      <Reveal className="map-card" delay={40}>
        {mapKeyId ? (
          <div
            ref={mapContainerRef}
            aria-label={`${location.venue} 네이버 지도`}
            className="map-card__naver"
          />
        ) : null}
        <img
          src={location.mapFallbackImage.src}
          alt={location.mapFallbackImage.alt}
          className={`map-card__fallback${mapReady ? ' is-hidden' : ''}`}
        />
        <div className="map-card__badge">
          <span>{location.venue}</span>
        </div>
      </Reveal>

      {mapError ? <p className="map-card__error">지도 로드 실패: {mapError}</p> : null}

      <Reveal className="location-copy" delay={120}>
        <strong>{location.address}</strong>
        {location.directions.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </Reveal>

      <Reveal className="map-link-grid" delay={180}>
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
      </Reveal>
    </section>
  )
}
