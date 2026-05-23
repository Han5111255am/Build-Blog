import type { ProjectListParams } from '@/features/projects/types/project'

export const defaultProjectListParams: ProjectListParams = {
  page: 1,
  page_size: 20,
  search: '',
  ordering: 'display_order',
  lang: '',
  status: '',
}

export function parseProjectListSearch(search: Record<string, unknown> | undefined): ProjectListParams {
  return {
    page: toPositiveNumber(search?.page, defaultProjectListParams.page),
    page_size: toPositiveNumber(search?.page_size, defaultProjectListParams.page_size),
    search: toStringValue(search?.search),
    ordering: toStringValue(search?.ordering) || defaultProjectListParams.ordering,
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

