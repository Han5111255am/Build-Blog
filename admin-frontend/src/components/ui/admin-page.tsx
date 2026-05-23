import { type ReactNode } from 'react'
import { useTranslation } from '@/features/i18n/use-translation'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  meta?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  meta,
  title,
}: PageHeaderProps) {
  const { tt } = useTranslation()

  return (
    <section
      className={cn(
        'rounded-[24px] border border-border bg-surface px-5 py-5 shadow-soft sm:px-6 sm:py-6',
        'flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          {tt(eyebrow)}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-[2.25rem]">
          {tt(title)}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{tt(description)}</p>
        ) : null}
        {meta ? <p className="mt-2 text-xs leading-5 text-muted">{tt(meta)}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </section>
  )
}

interface MetricCardProps {
  label: string
  value: ReactNode
  detail?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  className?: string
}

export function MetricCard({
  className,
  detail,
  label,
  tone = 'neutral',
  value,
}: MetricCardProps) {
  const { tt } = useTranslation()

  return (
    <article
      className={cn(
        'min-w-0 rounded-[20px] border border-border bg-surface p-5 shadow-soft',
        resolveMetricTone(tone),
        className,
      )}
    >
      <p className="text-[13px] font-semibold text-text">{tt(label)}</p>
      {detail ? <p className="mt-1 text-[13px] leading-5 text-muted">{tt(detail)}</p> : null}
      <div className="mt-6 break-words text-3xl font-semibold tracking-tight text-text">
        {value}
      </div>
    </article>
  )
}

export function SectionPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-[20px] border border-border bg-surface shadow-soft', className)}>
      {children}
    </section>
  )
}

function resolveMetricTone(tone: MetricCardProps['tone']) {
  if (tone === 'success') return 'shadow-[0_12px_28px_rgba(36,138,93,0.06)]'
  if (tone === 'warning') return 'shadow-[0_12px_28px_rgba(182,111,17,0.06)]'
  if (tone === 'danger') return 'shadow-[0_12px_28px_rgba(208,68,68,0.06)]'
  if (tone === 'accent') return 'shadow-[0_12px_28px_rgba(0,113,227,0.07)]'
  return ''
}
