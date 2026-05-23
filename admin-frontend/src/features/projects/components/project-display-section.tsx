import { forwardRef, type ChangeEvent } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'

interface ProjectDisplaySectionProps {
  errors: FieldErrors<ProjectFormValues>
  register: UseFormRegister<ProjectFormValues>
}

export function ProjectDisplaySection({ errors, register }: ProjectDisplaySectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Input
        label={t('封面地址', 'Cover Image')}
        error={errors.cover_image?.message}
        placeholder="https://images.example.com/..."
        {...register('cover_image')}
      />
      <NumberField
        label={t('展示顺序', 'Display Order')}
        error={errors.display_order?.message}
        {...register('display_order', { valueAsNumber: true })}
      />
      <p className="text-xs leading-6 text-muted">
        {t(
          '优先在项目列表页使用可视化排序，这里的数字字段只用于精确微调。',
          'Prefer visual ordering in the project list. Use this numeric field only for precise adjustments.',
        )}
      </p>
    </div>
  )
}

const NumberField = forwardRef<
  HTMLInputElement,
  {
    label: string
    error?: string
    value?: number
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    onBlur?: React.FocusEventHandler<HTMLInputElement>
    name?: string
  }
>(function NumberField({ error, label, name, onBlur, onChange, value }, ref) {
  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="font-medium">{label}</span>
      <input
        className="h-11 rounded-lg border border-border bg-white/12 px-4 text-sm text-text outline-none transition placeholder:text-muted focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:bg-white/[0.03]"
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        ref={ref}
        type="number"
        value={typeof value === 'number' && Number.isFinite(value) ? value : ''}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  )
})
