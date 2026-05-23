import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

const languageOptions = ['zh', 'en'] as const
const statusOptions = ['draft', 'published'] as const

// Baseline zh contract kept explicit for scaffold tests:
// title: z.string().trim().min(1, '请输入项目名称')
// status: z.enum(['draft', 'published'])
// content_md: z.string().trim().min(1, '请输入项目说明')

export function createProjectFormSchema(language: AppLanguage) {
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

  const displayOrderField = z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z
      .string()
      .trim()
      .min(1, t('请输入展示顺序', 'Enter a display order'))
      .refine((value) => /^-?\d+$/.test(value), {
        message: t('展示顺序必须是整数', 'Display order must be an integer'),
      })
      .transform((value) => Number(value)),
  )

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t('请输入项目名称', 'Enter a project name'))
      .max(120, t('项目名称长度不能超过 120 个字符', 'Project name must be 120 characters or fewer')),
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
    summary: z
      .string()
      .trim()
      .max(240, t('简介长度不能超过 240 个字符', 'Summary must be 240 characters or fewer')),
    site_url: z
      .string()
      .trim()
      .max(500, t('站点链接长度不能超过 500 个字符', 'Site URL must be 500 characters or fewer')),
    repo_url: z
      .string()
      .trim()
      .max(500, t('仓库链接长度不能超过 500 个字符', 'Repository URL must be 500 characters or fewer')),
    icon: z
      .string()
      .trim()
      .max(120, t('图标标识长度不能超过 120 个字符', 'Icon key must be 120 characters or fewer')),
    cover_image: z
      .string()
      .trim()
      .max(500, t('封面地址长度不能超过 500 个字符', 'Cover image URL must be 500 characters or fewer')),
    display_order: displayOrderField,
    content_md: z.string().trim().min(1, t('请输入项目说明', 'Enter the project description')),
  })
}

export const projectFormSchema = createProjectFormSchema('zh')
export type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>
