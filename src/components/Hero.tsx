import type { HeroContent } from '../types/site'

interface HeroProps {
  content: HeroContent
}

export function Hero({ content }: HeroProps) {
  return (
    <section id="home" className="hero-section">
      <div className="hero-section__image-wrap">
        <img src={content.image.src} alt={content.image.alt} className="hero-section__image" />
      </div>
      <div className="hero-section__overlay" />
      <div className="hero-section__content">
        <p className="eyebrow">{content.eyebrow}</p>
        <div className="eyebrow-divider" />
        <h1>{content.dateLabel}</h1>
        <p className="hero-section__time">{content.timeLabel}</p>
      </div>
    </section>
  )
}
