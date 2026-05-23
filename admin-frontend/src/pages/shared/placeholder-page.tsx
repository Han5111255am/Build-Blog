import { useTranslation } from '@/features/i18n/use-translation'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { tt } = useTranslation()

  return (
    <section className="rounded-xl border border-dashed border-border bg-surface/70 p-8">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">{tt('占位页')}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{tt(title)}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{tt(description)}</p>
    </section>
  )
}
