import type { NoteFormValues } from '@/features/notes/schema/note-form-schema'
import type { NoteDetail } from '@/features/notes/types/note'

export function mapNoteDetailToFormValues(detail: NoteDetail): NoteFormValues {
  return {
    title: detail.title,
    slug: detail.slug,
    lang: detail.lang,
    status: detail.status,
    tag_ids: detail.tag_ids,
    summary: detail.summary,
    published_at: detail.published_at ?? '',
    content_md: detail.content_md,
  }
}
