import type { EventDetailsContent, NavItem } from '../types/site'
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
          {details.cards.map((card) => (
            <article key={card.id} className="detail-card">
              <Icon name={card.icon} className="detail-card__icon" />
              <p className="detail-card__label">{card.label}</p>
              <div className="detail-card__value">
                {card.value.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
