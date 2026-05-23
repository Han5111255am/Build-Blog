import type { PostListParams } from '@/features/posts/types/post'

export const defaultPostListParams: PostListParams = {
  page: 1,
  page_size: 20,
  search: '',
  ordering: '-updated_at',
  lang: '',
  status: '',
}

export function parsePostListSearch(search: Record<string, unknown> | undefined): PostListParams {
  return {
    page: toPositiveNumber(search?.page, defaultPostListParams.page),
    page_size: toPositiveNumber(search?.page_size, defaultPostListParams.page_size),
    search: toStringValue(search?.search),
    ordering: toStringValue(search?.ordering) || defaultPostListParams.ordering,
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

