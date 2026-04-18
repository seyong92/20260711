import { Footer } from './components/Footer'
import { GallerySection } from './components/GallerySection'
import { Hero } from './components/Hero'
import { InvitationMessage } from './components/InvitationMessage'
import { FamilyInfo } from './components/FamilyInfo'
import { EventDetails } from './components/EventDetails'
import { LocationSection } from './components/LocationSection'
import { AccountSection } from './components/AccountSection'
import { ResponsiveNav } from './components/ResponsiveNav'
import { siteContent } from './data/siteContent'
import { useActiveSection } from './hooks/useActiveSection'
import type { NavItem } from './types/site'

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

function App() {
  const activeSection = useActiveSection(
    siteContent.sections.map((section) => section.sectionId),
  )

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
      </main>

      <Footer footer={siteContent.footer} gameEntry={siteContent.gameEntry} />
    </div>
  )
}

export default App
