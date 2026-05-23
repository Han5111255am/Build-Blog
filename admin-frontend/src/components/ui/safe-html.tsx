import { useEffect, useRef } from 'react'

interface SafeHtmlProps {
  className?: string
  html: string
}

// Renders HTML that has already been sanitized by the backend.
export function SafeHtml({ className, html }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    containerRef.current.innerHTML = html // nosemgrep: javascript.browser.security.insecure-document-method.insecure-document-method -- html content is sanitized server-side before reaching this component
  }, [html])

  return <div className={className} ref={containerRef} />
}
