export const breakpoints = {
  mobile: 767,
  tablet: 1100,
} as const

export const sectionOffsets = {
  mobile: 20,
  tablet: 24,
  desktop: 8,
} as const

export const sectionOffsetAdjustments = {
  details: {
    mobile: 0,
    tablet: 0,
    desktop: 0,
  },
  gallery: {
    mobile: 28,
    tablet: 34,
    desktop: 24,
  },
} as const

export const activeSectionOffsets = {
  mobile: 72,
  tablet: 82,
  desktop: 60,
} as const
