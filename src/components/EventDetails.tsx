import type { EventDetailsContent, NavItem } from '../types/site'
import { Reveal } from './Reveal'
import { Icon } from './icons'

interface EventDetailsProps {
  section: NavItem
  details: EventDetailsContent
}

export function EventDetails({ section, details }: EventDetailsProps) {
  return (
    <>
      <div id={section.sectionId} className="section-anchor" aria-hidden="true" />
      <section className="section section--details">
        <div className="detail-grid">
          {details.cards.map((card, index) => (
            <Reveal key={card.id} as="article" className="detail-card" delay={40 + index * 70}>
              <Icon name={card.icon} className="detail-card__icon" />
              <p className="detail-card__label">{card.label}</p>
              <div className="detail-card__value">
                {card.value.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
