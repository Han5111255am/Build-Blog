import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { TagFormValues } from '@/features/tags/schema/tag-form-schema'

interface TagBasicInfoSectionProps {
  errors: FieldErrors<TagFormValues>
  register: UseFormRegister<TagFormValues>
}

export function TagBasicInfoSection({ errors, register }: TagBasicInfoSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Input
        label={t('标签名称', 'Tag Name')}
        error={errors.name?.message}
        placeholder={t('请输入标签名称', 'Enter the tag name')}
        {...register('name')}
      />
      <Input
        label={t('标签别名', 'Tag Slug')}
        error={errors.slug?.message}
        placeholder="frontend"
        {...register('slug')}
      />
      <Input
        label={t('颜色值', 'Color Value')}
        error={errors.color?.message}
        placeholder="#6366F1"
        {...register('color')}
      />
    </div>
  )
}
