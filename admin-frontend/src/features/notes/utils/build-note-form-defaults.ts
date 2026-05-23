import type { NoteFormValues } from '@/features/notes/schema/note-form-schema'
import type { AppLanguage } from '@/stores/ui-preferences'

interface BuildNoteFormDefaultsOptions {
  mode: 'create' | 'edit'
  language: AppLanguage
}

export function buildNoteFormDefaults({ language, mode }: BuildNoteFormDefaultsOptions): NoteFormValues {
  const isEnglish = language === 'en'

  if (mode === 'edit') {
    return {
      title: isEnglish ? 'Product Notes: Lightweight Admin Editing' : '产品随记：管理后台轻编辑体验',
      slug: 'lightweight-admin-note',
      lang: language,
      status: 'draft',
      tag_ids: [1, 2],
      summary: isEnglish ? 'Example content for the note editor form state layer.' : '用于展示 Notes 编辑页表单状态层的示例内容。',
      published_at: '2026-03-07 11:10',
      content_md: isEnglish ? '# Product Notes: Lightweight Admin Editing\n\nThis is the preset body for the current note.' : '# 产品随记：管理后台轻编辑体验\n\n这里是当前笔记的预置正文。',
    }
  }

  return {
    title: '',
    slug: '',
    lang: language,
    status: 'draft',
    tag_ids: [1],
    summary: '',
    published_at: '',
    content_md: isEnglish ? '# New Note Title\n\nStart capturing ideas here.' : '# 新笔记标题\n\n在这里开始记录想法。',
  }
}
