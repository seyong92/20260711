import { useEffect, useRef, useState } from 'react'

import type { HeroContent } from '../types/site'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface HeroProps {
  content: HeroContent
}

export function Hero({ content }: HeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsReady(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) {
      return
    }

    const setStaticMotion = () => {
      node.style.setProperty('--hero-image-offset', '0px')
      node.style.setProperty('--hero-content-offset', '0px')
      node.style.setProperty('--hero-eyebrow-offset', '0px')
      node.style.setProperty('--hero-content-opacity', '1')
    }

    if (prefersReducedMotion) {
      setStaticMotion()
      return
    }

    let frameId = 0

    const updateMotion = () => {
      frameId = 0

      const rect = node.getBoundingClientRect()
      const viewportHeight = window.innerHeight || rect.height
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
      const normalizedProgress = Math.max(0, Math.min(1.2, progress))
      const imageOffset = (normalizedProgress - 0.24) * 300
      const contentOffset = (0.54 - normalizedProgress) * 48
      const eyebrowOffset = (0.56 - normalizedProgress) * 28
      const contentOpacity = Math.max(0.64, 1 - Math.max(0, normalizedProgress - 0.54) * 0.46)

      node.style.setProperty('--hero-image-offset', `${imageOffset}px`)
      node.style.setProperty('--hero-content-offset', `${contentOffset}px`)
      node.style.setProperty('--hero-eyebrow-offset', `${eyebrowOffset}px`)
      node.style.setProperty('--hero-content-opacity', `${contentOpacity}`)
    }

    const requestUpdate = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(updateMotion)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      setStaticMotion()
    }
  }, [prefersReducedMotion])

  return (
    <section
      id="home"
      ref={sectionRef}
      className={`hero-section${prefersReducedMotion || isReady ? ' is-ready' : ''}`}
    >
      <div className="hero-section__media">
        <img src={content.image.src} alt={content.image.alt} className="hero-section__image" />
        <div className="hero-section__overlay" />
      </div>
      <div className="hero-section__content">
        <div className="hero-section__content-inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <div className="eyebrow-divider" />
          <h1>{content.dateLabel}</h1>
          <p className="hero-section__time">{content.timeLabel}</p>
        </div>
      </div>
    </section>
  )
}
