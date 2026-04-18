import { useEffect } from 'react'

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

  useEffect(() => {
    document.title = siteContent.meta.title

    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) {
      descriptionTag.setAttribute('content', siteContent.meta.description)
    }

    const faviconTag = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (faviconTag) {
      faviconTag.href = siteContent.meta.faviconSrc
      return
    }

    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = siteContent.meta.faviconSrc
    document.head.appendChild(link)
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

export default App
