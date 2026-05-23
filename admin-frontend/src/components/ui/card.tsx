import { PropsWithChildren } from 'react'
import { useTranslation } from '@/features/i18n/use-translation'

interface CardProps {
  title: string
  description?: string
}

export function Card({ children, description, title }: PropsWithChildren<CardProps>) {
  const { tt } = useTranslation()

  return (
    <article className="admin-card min-w-0 overflow-hidden p-5">
      <p className="text-[13px] font-semibold text-text">{tt(title)}</p>
      {description ? <p className="mt-1 text-[13px] leading-5 text-muted">{tt(description)}</p> : null}
      <div className="mt-5">{children}</div>
    </article>
  )
}
