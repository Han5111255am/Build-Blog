import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

const languageOptions = ['zh', 'en'] as const
const statusOptions = ['draft', 'published'] as const

export function createNoteFormSchema(language: AppLanguage) {
  const t = (zh: string, en: string) => pickText(language, zh, en)
  const createEnumField = <T extends readonly [string, ...string[]]>(
    options: T,
    requiredMessage: [string, string],
    invalidMessage: [string, string],
  ) =>
    z
      .string()
      .trim()
      .min(1, t(requiredMessage[0], requiredMessage[1]))
      .refine((value): value is T[number] => options.includes(value as T[number]), {
        message: t(invalidMessage[0], invalidMessage[1]),
      })

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t('请输入笔记标题', 'Enter a note title'))
      .max(120, t('标题长度不能超过 120 个字符', 'Title must be 120 characters or fewer')),
    slug: z
      .string()
      .trim()
      .max(120, t('Slug 长度不能超过 120 个字符', 'Slug must be 120 characters or fewer'))
      .regex(
        /^[a-z0-9-]*$/,
        t('Slug 仅允许小写字母、数字和中划线', 'Slug can only contain lowercase letters, numbers, and hyphens'),
      )
      .or(z.literal('')),
    lang: createEnumField(
      languageOptions,
      ['请选择语言', 'Select a language'],
      ['语言仅支持 zh 或 en', 'Language must be either zh or en'],
    ),
    status: createEnumField(
      statusOptions,
      ['请选择状态', 'Select a status'],
      ['状态仅支持 draft 或 published', 'Status must be draft or published'],
    ),
    tag_ids: z
      .array(
        z.number({
          invalid_type_error: t('标签标识必须为数字', 'Tag IDs must be numbers'),
        }),
      )
      .default([]),
    summary: z
      .string()
      .trim()
      .max(240, t('摘要长度不能超过 240 个字符', 'Summary must be 240 characters or fewer')),
    published_at: z.string().trim(),
    content_md: z.string().trim().min(1, t('请输入正文内容', 'Enter the main content')),
  })
}

export const noteFormSchema = createNoteFormSchema('zh')
export type NoteFormValues = z.infer<ReturnType<typeof createNoteFormSchema>>
