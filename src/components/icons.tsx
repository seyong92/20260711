import type { NavIcon } from '../types/site'

interface IconProps {
  name: NavIcon
  className?: string
}

export function Icon({ name, className }: IconProps) {
  switch (name) {
    case 'home':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'calendar':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'heart':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-6.5-4.35-8.5-8.06C1.6 8.51 3.2 5 6.82 5c2.05 0 3.32 1.1 4.18 2.42C11.86 6.1 13.13 5 15.18 5 18.8 5 20.4 8.5 20.5 11.94 18.5 15.65 12 20 12 20Z" fill="currentColor" /></svg>
    case 'location':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s6-5.36 6-11a6 6 0 1 0-12 0c0 5.64 6 11 6 11Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.4" fill="currentColor" /></svg>
    case 'gallery':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="1.6" stroke="currentColor" strokeWidth="1.6" /><path d="m7 15 2.8-2.8a1 1 0 0 1 1.4 0l2.1 2.1 1.8-1.8a1 1 0 0 1 1.4 0L19 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="9" r="1.2" fill="currentColor" /></svg>
    case 'gift':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Zm0 0h16V7.8A1.8 1.8 0 0 0 18.2 6H5.8A1.8 1.8 0 0 0 4 7.8V10Zm8-4v15M8.3 6c-1.38 0-2.3-.82-2.3-1.88C6 2.97 7.05 2 8.37 2c1.5 0 2.65 1.12 3.63 4H8.3Zm7.4 0c1.38 0 2.3-.82 2.3-1.88C18 2.97 16.95 2 15.63 2c-1.5 0-2.65 1.12-3.63 4h3.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'menu':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    case 'close':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    case 'copy':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><path d="M7 15H6a1 1 0 0 1-1-1V5.5A1.5 1.5 0 0 1 6.5 4H15a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    case 'arrowLeft':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'arrowRight':
      return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    default:
      return null
  }
}
