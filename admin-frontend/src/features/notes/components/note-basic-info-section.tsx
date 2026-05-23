import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { NoteFormValues } from '@/features/notes/schema/note-form-schema'

interface NoteBasicInfoSectionProps {
  errors: FieldErrors<NoteFormValues>
  register: UseFormRegister<NoteFormValues>
}

export function NoteBasicInfoSection({ errors, register }: NoteBasicInfoSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Input
        label={t('标题', 'Title')}
        error={errors.title?.message}
        placeholder={t('输入笔记标题', 'Enter the note title')}
        {...register('title')}
      />
      <Input
        label={t('别名', 'Slug')}
        error={errors.slug?.message}
        placeholder={t('可选，留空可后续自动生成', 'Optional. Leave empty to generate it later')}
        {...register('slug')}
      />
      <Input
        label={t('语言', 'Language')}
        error={errors.lang?.message}
        placeholder="zh / en"
        {...register('lang')}
      />
      <Input
        label={t('摘要', 'Summary')}
        error={errors.summary?.message}
        placeholder={t('用于列表与预览区的摘要文案', 'Used in the list and preview summary')}
        {...register('summary')}
      />
    </div>
  )
}
