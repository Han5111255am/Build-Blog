import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'

interface ProjectLinksSectionProps {
  errors: FieldErrors<ProjectFormValues>
  register: UseFormRegister<ProjectFormValues>
}

export function ProjectLinksSection({ errors, register }: ProjectLinksSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Input
        label={t('站点链接', 'Site URL')}
        error={errors.site_url?.message}
        placeholder="https://"
        {...register('site_url')}
      />
      <Input
        label={t('仓库链接', 'Repository URL')}
        error={errors.repo_url?.message}
        placeholder="https://github.com/..."
        {...register('repo_url')}
      />
      <Input
        label={t('图标标识', 'Icon Key')}
        error={errors.icon?.message}
        placeholder={t('图标名称', 'icon name')}
        {...register('icon')}
      />
    </div>
  )
}
