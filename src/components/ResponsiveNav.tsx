import { useEffect, useState } from 'react'

import {
  breakpoints,
  sectionOffsetAdjustments,
  sectionOffsets,
} from '../theme/tokens'
import type { CoupleProfile, NavItem, SectionId } from '../types/site'
import { Icon } from './icons'

interface ResponsiveNavProps {
  items: NavItem[]
  couple: CoupleProfile
  activeSection: SectionId
}

function scrollToSection(sectionId: SectionId) {
  const section = document.getElementById(sectionId)
  if (!section) {
    return
  }

  const currentWidth = window.innerWidth
  const offset =
    currentWidth <= breakpoints.mobile
      ? sectionOffsets.mobile
      : currentWidth <= breakpoints.tablet
        ? sectionOffsets.tablet
        : sectionOffsets.desktop

  const adjustment = sectionOffsetAdjustments[sectionId as keyof typeof sectionOffsetAdjustments]
  const extraOffset = adjustment
    ? currentWidth <= breakpoints.mobile
      ? adjustment.mobile
      : currentWidth <= breakpoints.tablet
        ? adjustment.tablet
        : adjustment.desktop
    : 0

  const targetTop =
    section.getBoundingClientRect().top + window.scrollY - offset - extraOffset

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth',
  })
}

export function ResponsiveNav({
  items,
  couple,
  activeSection,
}: ResponsiveNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > breakpoints.tablet) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="menu-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} className="nav-icon" />
        </button>
        <div className="topbar__brand">
          <span>{couple.groom}</span>
          <span>&</span>
          <span>{couple.bride}</span>
        </div>
      </header>

      <aside className="desktop-nav" aria-label="고정 메뉴">
        <div className="desktop-nav__brand">
          <span>{couple.groom}</span>
          <span>&</span>
          <span>{couple.bride}</span>
        </div>
        <nav className="desktop-nav__list">
          {items.map((item) => {
            const isActive = item.sectionId === activeSection

            return (
              <button
                key={item.id}
                type="button"
                className={`desktop-nav__item${isActive ? ' is-active' : ''}`}
                onClick={() => scrollToSection(item.sectionId)}
              >
                <Icon name={item.icon} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div
        className={`tablet-drawer-backdrop${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <aside className={`tablet-drawer${menuOpen ? ' is-open' : ''}`} aria-label="탭 메뉴">
        <div className="tablet-drawer__header">
          <p>빠른 이동</p>
          <button
            type="button"
            className="menu-trigger is-inline"
            onClick={() => setMenuOpen(false)}
            aria-label="메뉴 닫기"
          >
            <Icon name="close" className="nav-icon" />
          </button>
        </div>
        <nav className="tablet-drawer__list">
          {items.map((item) => {
            const isActive = item.sectionId === activeSection

            return (
              <button
                key={item.id}
                type="button"
                className={`tablet-drawer__item${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  scrollToSection(item.sectionId)
                  setMenuOpen(false)
                }}
              >
                <Icon name={item.icon} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <nav className="bottom-nav" aria-label="하단 메뉴">
        {items.map((item) => {
          const isActive = item.sectionId === activeSection

          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav__item${isActive ? ' is-active' : ''}`}
              onClick={() => scrollToSection(item.sectionId)}
            >
              <Icon name={item.icon} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
