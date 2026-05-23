import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from '@/features/i18n/use-translation'
import type { TagFormValues } from '@/features/tags/schema/tag-form-schema'

interface TagDescriptionSectionProps {
  errors: FieldErrors<TagFormValues>
  register: UseFormRegister<TagFormValues>
}

export function TagDescriptionSection({ errors, register }: TagDescriptionSectionProps) {
  const { t } = useTranslation()

  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{t('标签说明', 'Tag Description')}</span>
      <textarea
        className="admin-textarea min-h-[240px] resize-y px-4 py-3 text-sm leading-7 placeholder:text-muted"
        placeholder={t('请输入标签说明', 'Enter the tag description')}
        {...register('description')}
      />
      {errors.description?.message ? (
        <span className="text-xs text-danger">{errors.description.message}</span>
      ) : null}
    </label>
  )
}
