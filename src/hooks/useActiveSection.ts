import { useEffect, useState } from 'react'

import { activeSectionOffsets, breakpoints } from '../theme/tokens'
import type { SectionId } from '../types/site'

export function useActiveSection(sectionIds: SectionId[]) {
  const [activeSection, setActiveSection] = useState<SectionId>(sectionIds[0] ?? 'home')

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (sections.length === 0) {
      return
    }

    const getOffset = () => {
      if (window.innerWidth <= breakpoints.mobile) {
        return activeSectionOffsets.mobile
      }

      if (window.innerWidth <= breakpoints.tablet) {
        return activeSectionOffsets.tablet
      }

      return activeSectionOffsets.desktop
    }

    const updateActiveSection = () => {
      const scrollLine = window.scrollY + getOffset()
      let currentSection = sections[0].id as SectionId

      for (const section of sections) {
        const sectionTop = section.offsetTop

        if (scrollLine >= sectionTop) {
          currentSection = section.id as SectionId
        } else {
          break
        }
      }

      setActiveSection(currentSection)
    }

    updateActiveSection()

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [sectionIds])

  return activeSection
}
