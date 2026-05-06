import { useEffect } from 'react'

import { siteContent } from '../data/siteContent'
import { useActiveSection } from '../hooks/useActiveSection'
import { applySiteMeta } from '../lib/socialMeta'
import type { NavItem } from '../types/site'
import { AccountSection } from './AccountSection'
import { EventDetails } from './EventDetails'
import { FamilyInfo } from './FamilyInfo'
import { Footer } from './Footer'
import { GallerySection } from './GallerySection'
import { Hero } from './Hero'
import { InvitationMessage } from './InvitationMessage'
import { LocationSection } from './LocationSection'
import { ResponsiveNav } from './ResponsiveNav'

const invitationSection: NavItem = {
  id: 'section-invitation',
  label: '초대',
  icon: 'heart',
  sectionId: 'invitation',
}

const familySection: NavItem = {
  id: 'section-family',
  label: '가족',
  icon: 'heart',
  sectionId: 'family',
}

export function InvitationPage() {
  const activeSection = useActiveSection(
    siteContent.sections.map((section) => section.sectionId),
  )

  useEffect(() => {
    applySiteMeta(siteContent.meta)
  }, [])

  return (
    <div className="app-shell">
      <ResponsiveNav
        items={siteContent.sections}
        couple={siteContent.couple}
        activeSection={activeSection}
      />

      <main className="page-main">
        <Hero content={siteContent.hero} />
        <InvitationMessage
          section={invitationSection}
          couple={siteContent.couple}
          invitation={siteContent.invitation}
        />
        <FamilyInfo section={familySection} family={siteContent.family} />
        <EventDetails
          section={siteContent.sections.find((section) => section.sectionId === 'details')!}
          details={siteContent.eventDetails}
        />
        <LocationSection
          section={siteContent.sections.find((section) => section.sectionId === 'location')!}
          location={siteContent.location}
        />
        <AccountSection
          section={siteContent.sections.find((section) => section.sectionId === 'accounts')!}
          accounts={siteContent.accounts}
        />
        <GallerySection
          section={siteContent.sections.find((section) => section.sectionId === 'gallery')!}
          gallery={siteContent.gallery}
        />
        <Footer footer={siteContent.footer} />
      </main>
    </div>
  )
}
