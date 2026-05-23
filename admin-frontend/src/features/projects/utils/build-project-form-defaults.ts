import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildProjectFormDefaultsOptions {
  mode: 'create' | 'edit'
  language?: AppLanguage
}

export function buildProjectFormDefaults({ language, mode }: BuildProjectFormDefaultsOptions): ProjectFormValues {
  const resolvedLanguage = language ?? 'zh'
  const isEnglish = resolvedLanguage === 'en'

  if (mode === 'edit') {
    return {
      title: 'Personal Blog Admin',
      slug: 'personal-blog-admin',
      lang: resolvedLanguage,
      status: 'published',
      summary: isEnglish ? 'Example data used to demonstrate the project editor form state layer and API scaffold.' : '用于展示 Projects 编辑页表单状态层与接口接入骨架的示例数据。',
      site_url: 'https://example.com/personal-blog-admin',
      repo_url: 'https://github.com/example/personal-blog-admin',
      icon: 'sparkles',
      cover_image: 'https://images.example.com/project-cover.png',
      display_order: 1,
      content_md: isEnglish ? '# Personal Blog Admin\n\nThis is the preset description for the current project.' : '# Personal Blog Admin\n\n这里是当前项目说明的预置内容。',
    }
  }

  return {
    title: '',
    slug: '',
    lang: resolvedLanguage,
    status: 'draft',
    summary: '',
    site_url: '',
    repo_url: '',
    icon: '',
    cover_image: '',
    display_order: 1,
    content_md: isEnglish ? '# New Project\n\nStart writing the project description here.' : '# 新项目\n\n在这里开始编写项目介绍。',
  }
}
