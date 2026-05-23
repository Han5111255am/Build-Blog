import type { NoteListParams } from '@/features/notes/types/note'

export const noteQueryKeys = {
  all: ['notes'] as const,
  lists: () => [...noteQueryKeys.all, 'list'] as const,
  list: (params: NoteListParams) => [...noteQueryKeys.lists(), params] as const,
  details: () => [...noteQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteQueryKeys.details(), id] as const,
  options: () => [...noteQueryKeys.all, 'options'] as const,
  tagOptions: (search = '') => [...noteQueryKeys.options(), 'tags', search] as const,
}

