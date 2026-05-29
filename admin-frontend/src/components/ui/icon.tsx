import { SVGProps } from 'react'

type IconName =
  | 'dashboard'
  | 'posts'
  | 'notes'
  | 'projects'
  | 'friendLinks'
  | 'tags'
  | 'assets'
  | 'photos'
  | 'podcasts'
  | 'system'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'systemTheme'
  | 'logout'
  | 'chevronLeft'
  | 'chevronRight'
  | 'spark'
  | 'pulse'
  | 'layers'
  | 'bell'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      )
    case 'posts':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M4.5 5.5c2.2-.9 4.8-.7 7.5.8v13.2c-2.7-1.5-5.3-1.7-7.5-.8z" />
          <path d="M12 6.3c2.7-1.5 5.3-1.7 7.5-.8v13.2c-2.2-.9-4.8-.7-7.5.8z" />
          <path d="M12 6.3v13.2" />
          <path d="M7.2 9.2c.9-.1 1.8.1 2.7.5" />
          <path d="M14.1 9.7c.9-.4 1.8-.6 2.7-.5" />
        </svg>
      )
    case 'notes':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M7 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
          <path d="M15 3.5V8h4" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      )
    case 'projects':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
          <path d="M8 5V3.5h8V5" />
          <path d="M4 10.5h16" />
        </svg>
      )
    case 'friendLinks':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M8.4 12.7 6.9 14.2a3.7 3.7 0 0 0 5.2 5.2l2.2-2.2a3.7 3.7 0 0 0 0-5.2" />
          <path d="m15.6 11.3 1.5-1.5a3.7 3.7 0 0 0-5.2-5.2L9.7 6.8a3.7 3.7 0 0 0 0 5.2" />
          <path d="m9.8 14.2 4.4-4.4" />
        </svg>
      )
    case 'tags':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m12.5 3.5 8 8-8 8-8-8V3.5z" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'assets':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 14l2.5-2.5L13 14l3.5-3.5L20 14" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
      )
    case 'photos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.1l1.2-1.8h4.4L15.4 6h2.1A2.5 2.5 0 0 1 20 8.5v7.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.3z" />
          <circle cx="12" cy="12.5" r="3.2" />
          <path d="M17.2 9.2h.01" />
        </svg>
      )
    case 'podcasts':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <circle cx="12" cy="11" r="5" />
          <path d="M12 16v4" />
          <path d="M8 20h8" />
          <path d="M5.5 8.5a8 8 0 0 1 13 0" />
        </svg>
      )
    case 'system':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M4.9 4.9l2.1 2.1" />
          <path d="M17 17l2.1 2.1" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="M4.9 19.1 7 17" />
          <path d="M17 7l2.1-2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M10.2 4.2a1 1 0 0 1 1-.7h1.6a1 1 0 0 1 1 .7l.4 1.4a1 1 0 0 0 .8.7l1.5.2a1 1 0 0 1 .8.8l.3 1.4a1 1 0 0 0 .6.7l1.3.5a1 1 0 0 1 .6 1v1.6a1 1 0 0 1-.6 1l-1.3.5a1 1 0 0 0-.6.7l-.3 1.4a1 1 0 0 1-.8.8l-1.5.2a1 1 0 0 0-.8.7l-.4 1.4a1 1 0 0 1-1 .7h-1.6a1 1 0 0 1-1-.7l-.4-1.4a1 1 0 0 0-.8-.7l-1.5-.2a1 1 0 0 1-.8-.8l-.3-1.4a1 1 0 0 0-.6-.7l-1.3-.5a1 1 0 0 1-.6-1v-1.6a1 1 0 0 1 .6-1l1.3-.5a1 1 0 0 0 .6-.7l.3-1.4a1 1 0 0 1 .8-.8l1.5-.2a1 1 0 0 0 .8-.7z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2" />
          <path d="M12 19.3v2.2" />
          <path d="M4.9 4.9 6.5 6.5" />
          <path d="M17.5 17.5 19.1 19.1" />
          <path d="M2.5 12h2.2" />
          <path d="M19.3 12h2.2" />
          <path d="M4.9 19.1 6.5 17.5" />
          <path d="M17.5 6.5 19.1 4.9" />
        </svg>
      )
    case 'moon':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M18 14.5A6.5 6.5 0 1 1 9.5 6a7 7 0 1 0 8.5 8.5Z" />
        </svg>
      )
    case 'systemTheme':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
          <path d="M8 19.5h8" />
          <path d="M12 16.5v3" />
        </svg>
      )
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M10 6H7.5A2.5 2.5 0 0 0 5 8.5v7A2.5 2.5 0 0 0 7.5 18H10" />
          <path d="M14 16.5 19 12l-5-4.5" />
          <path d="M19 12H9" />
        </svg>
      )
    case 'chevronLeft':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      )
    case 'chevronRight':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      )
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        </svg>
      )
    case 'pulse':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      )
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="m12 4 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4" />
          <path d="m4 16 8 4 8-4" />
        </svg>
      )
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M6.5 16.5h11l-1.2-1.8a3 3 0 0 1-.5-1.7V10a3.8 3.8 0 1 0-7.6 0v3a3 3 0 0 1-.5 1.7z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </svg>
      )
  }
}
