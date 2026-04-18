export type SectionId =
  | 'home'
  | 'invitation'
  | 'family'
  | 'details'
  | 'location'
  | 'accounts'
  | 'gallery'

export type NavIcon =
  | 'home'
  | 'calendar'
  | 'heart'
  | 'location'
  | 'gallery'
  | 'gift'
  | 'menu'
  | 'close'
  | 'copy'
  | 'arrowLeft'
  | 'arrowRight'

export interface NavItem {
  id: string
  label: string
  icon: NavIcon
  sectionId: SectionId
}

export interface CoupleProfile {
  groom: string
  bride: string
}

export interface SiteMetaContent {
  title: string
  description: string
  faviconSrc: string
}

export interface HeroContent {
  dateLabel: string
  timeLabel: string
  eyebrow: string
  image: {
    src: string
    alt: string
  }
}

export interface InvitationContent {
  headline: string[]
  closingIconLabel: string
}

export interface FamilyParent {
  name: string
  deceased?: boolean
}

export interface FamilySide {
  roleLabel: string
  parents: FamilyParent[]
  relation: string
  name: string
}

export interface FamilyContent {
  groom: FamilySide
  bride: FamilySide
}

export interface DetailCard {
  id: string
  icon: NavIcon
  label: string
  value: string[]
}

export interface EventDetailsContent {
  cards: DetailCard[]
}

export interface MapLink {
  provider: string
  label: string
  href: string
}

export interface LocationContent {
  title: string
  venue: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  directions: string[]
  mapFallbackImage: {
    src: string
    alt: string
  }
  mapLinks: MapLink[]
}

export interface AccountEntry {
  bank: string
  accountNumber: string
  holder: string
  side: 'groom' | 'bride'
  relationship: string
}

export interface AccountsContent {
  title: string
  description: string[]
  entries: AccountEntry[]
}

export interface GalleryItem {
  id: string
  src: string
  alt: string
  ratio: string
  caption?: string
}

export interface GalleryContent {
  title: string
  subtitle: string
  items: GalleryItem[]
}

export interface FooterContent {
  license: string
  teaserLabel: string
  panelTitle: string
  panelDescription: string
}

export interface SiteContent {
  meta: SiteMetaContent
  couple: CoupleProfile
  hero: HeroContent
  invitation: InvitationContent
  family: FamilyContent
  eventDetails: EventDetailsContent
  location: LocationContent
  accounts: AccountsContent
  gallery: GalleryContent
  footer: FooterContent
  sections: NavItem[]
}
