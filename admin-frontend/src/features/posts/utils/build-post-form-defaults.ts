import type { PostFormValues } from '@/features/posts/schema/post-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildPostFormDefaultsOptions {
  mode: 'create' | 'edit'
  language: AppLanguage
}

export function buildPostFormDefaults({ language, mode }: BuildPostFormDefaultsOptions): PostFormValues {
  const isEnglish = language === 'en'

  if (mode === 'edit') {
    return {
      title: isEnglish ? 'Modern Admin Scaffold in Practice' : '现代后台工程骨架实践',
      slug: 'modern-admin-scaffold',
      lang: language,
      status: 'published',
      tag_ids: [1, 2],
      summary: isEnglish ? 'Example content used to demonstrate the post editor scaffold and follow-up form state integration.' : '一篇用于展示后台文章编辑页骨架与后续表单状态接入方向的示例内容。',
      cover_image: '',
      published_at: '2026-03-07 10:00',
      content_md: isEnglish ? '# Modern Admin Scaffold in Practice\n\nThis is the preset body for the current post.' : '# 现代后台工程骨架实践\n\n这是当前文章内容的骨架预置。',
    }
  }

  return {
    title: '',
    slug: '',
    lang: language,
    status: 'draft',
    tag_ids: [1, 2],
    summary: '',
    cover_image: '',
    published_at: '',
    content_md: isEnglish ? '# New Post Title\n\nStart writing here.' : '# 新文章标题\n\n在这里开始撰写正文。',
  }
}
