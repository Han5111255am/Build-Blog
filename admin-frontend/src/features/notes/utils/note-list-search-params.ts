import type { NoteListParams } from '@/features/notes/types/note'

export const defaultNoteListParams: NoteListParams = {
  page: 1,
  page_size: 20,
  search: '',
  ordering: '-updated_at',
  lang: '',
  status: '',
}

export function parseNoteListSearch(search: Record<string, unknown> | undefined): NoteListParams {
  return {
    page: toPositiveNumber(search?.page, defaultNoteListParams.page),
    page_size: toPositiveNumber(search?.page_size, defaultNoteListParams.page_size),
    search: toStringValue(search?.search),
    ordering: toStringValue(search?.ordering) || defaultNoteListParams.ordering,
    lang: toEnumValue(search?.lang, ['', 'zh', 'en']),
    status: toEnumValue(search?.status, ['', 'draft', 'published']),
  }
}

function toPositiveNumber(value: unknown, fallback: number) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toEnumValue<T extends string>(value: unknown, allowed: readonly T[]): T {
  return allowed.includes(value as T) ? (value as T) : allowed[0]
}

