import type { TagFormValues } from '@/features/tags/schema/tag-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildTagFormDefaultsOptions {
  mode: 'create' | 'edit'
  language: AppLanguage
}

export function buildTagFormDefaults({ language, mode }: BuildTagFormDefaultsOptions): TagFormValues {
  if (mode === 'edit') {
    return {
      name: language === 'en' ? 'Frontend' : '前端',
      slug: 'frontend',
      color: '#6366F1',
      description:
        language === 'en'
          ? 'Used to label frontend engineering, interaction, and design system related content.'
          : '用于标记前端工程、交互和设计系统相关内容。',
    }
  }

  return {
    name: '',
    slug: '',
    color: '#6366F1',
    description: '',
  }
}
