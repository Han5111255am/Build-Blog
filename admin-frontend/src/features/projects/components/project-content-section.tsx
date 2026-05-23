import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from '@/features/i18n/use-translation'
import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'

interface ProjectContentSectionProps {
  errors: FieldErrors<ProjectFormValues>
  register: UseFormRegister<ProjectFormValues>
}

export function ProjectContentSection({ errors, register }: ProjectContentSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <ToolbarChip label={t('概述', 'Overview')} />
        <ToolbarChip label={t('亮点', 'Highlights')} />
        <ToolbarChip label={t('技术栈', 'Tech Stack')} />
        <ToolbarChip label={t('截图', 'Screenshots')} />
        <ToolbarChip label={t('链接', 'Link')} />
      </div>
      <label className="flex flex-col gap-2 text-sm text-text">
        <span className="text-[13px] font-semibold">{t('项目说明', 'Project Description')}</span>
        <textarea
          className="admin-textarea min-h-[560px] w-full resize-y p-4 text-sm leading-7"
          {...register('content_md')}
        />
        {errors.content_md?.message ? (
          <span className="text-xs text-danger">{errors.content_md.message}</span>
        ) : null}
      </label>
    </div>
  )
}

function ToolbarChip({ label }: { label: string }) {
  return (
    <button
      className="admin-button-secondary admin-button-sm"
      type="button"
    >
      {label}
    </button>
  )
}
