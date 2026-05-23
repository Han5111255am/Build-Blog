import type { TagListParams } from '@/features/tags/types/tag'

export const defaultTagListParams: TagListParams = {
  page: 1,
  page_size: 20,
  search: '',
  ordering: 'name',
}

export function parseTagListSearch(search: Record<string, unknown> | undefined): TagListParams {
  return {
    page: toPositiveNumber(search?.page, defaultTagListParams.page),
    page_size: toPositiveNumber(search?.page_size, defaultTagListParams.page_size),
    search: toStringValue(search?.search),
    ordering: toStringValue(search?.ordering) || defaultTagListParams.ordering,
  }
}

function toPositiveNumber(value: unknown, fallback: number) {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

