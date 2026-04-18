import type { CoupleProfile, InvitationContent, NavItem } from '../types/site'
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
      <div className="names-block">
        <h2>{couple.groom}</h2>
        <p className="names-block__ampersand">&amp;</p>
        <h2>{couple.bride}</h2>
      </div>

      <div className="invitation-copy">
        {invitation.headline.map((line, index) =>
          line ? (
            <p key={`${line}-${index}`}>{line}</p>
          ) : (
            <div key={`spacer-${index}`} className="invitation-copy__spacer" aria-hidden="true" />
          ),
        )}
      </div>

      <div className="heart-mark" aria-label={invitation.closingIconLabel}>
        <Icon name="heart" className="heart-mark__icon" />
      </div>
    </section>
  )
}
