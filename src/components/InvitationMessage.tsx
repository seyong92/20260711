import type { CoupleProfile, InvitationContent, NavItem } from '../types/site'
import { Reveal } from './Reveal'
import { Icon } from './icons'

interface InvitationMessageProps {
  section: NavItem
  couple: CoupleProfile
  invitation: InvitationContent
}

export function InvitationMessage({
  section,
  couple,
  invitation,
}: InvitationMessageProps) {
  return (
    <section id={section.sectionId} className="section section--invitation">
      <div className="invitation-intro">
        <Reveal className="names-block" delay={40}>
          <h2>{couple.groom}</h2>
          <p className="names-block__ampersand">&amp;</p>
          <h2>{couple.bride}</h2>
        </Reveal>

        <Reveal className="heart-mark" delay={140} aria-label={invitation.closingIconLabel}>
          <Icon name="heart" className="heart-mark__icon" />
        </Reveal>
      </div>

      <div className="invitation-copy">
        {invitation.headline.map((line, index) =>
          line ? (
            <Reveal key={`${line}-${index}`} as="p" delay={120 + index * 70}>
              {line}
            </Reveal>
          ) : (
            <div key={`spacer-${index}`} className="invitation-copy__spacer" aria-hidden="true" />
          ),
        )}
      </div>
    </section>
  )
}
