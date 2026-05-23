import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

const slugPattern = /^[a-z0-9-]*$/
const platformOptions = ['spotify', 'apple', 'youtube', 'rss'] as const
const languageOptions = ['zh', 'en'] as const

export function createPodcastFormSchema(language: AppLanguage) {
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
      .min(1, t('请输入标题', 'Enter a title'))
      .max(120, t('标题长度不能超过 120 个字符', 'Title must be 120 characters or fewer')),
    slug: z
      .string()
      .trim()
      .max(120, t('Slug 长度不能超过 120 个字符', 'Slug must be 120 characters or fewer'))
      .regex(
        slugPattern,
        t('Slug 仅允许小写字母、数字和中划线', 'Slug can only contain lowercase letters, numbers, and hyphens'),
      )
      .or(z.literal('')),
    platform: createEnumField(
      platformOptions,
      ['请选择平台', 'Select a platform'],
      ['平台仅支持 spotify、apple、youtube 或 rss', 'Platform must be spotify, apple, youtube, or rss'],
    ),
    url: z
      .string()
      .trim()
      .min(1, t('请输入播客地址', 'Enter the podcast URL'))
      .max(500, t('URL 长度不能超过 500 个字符', 'URL must be 500 characters or fewer')),
    lang: createEnumField(
      languageOptions,
      ['请选择语言', 'Select a language'],
      ['语言仅支持 zh 或 en', 'Language must be either zh or en'],
    ),
    published_at: z.string().trim().min(1, t('请输入发布时间', 'Enter the publish time')),
    cover_url: z
      .string()
      .trim()
      .max(500, t('封面 URL 长度不能超过 500 个字符', 'Cover URL must be 500 characters or fewer'))
      .or(z.literal('')),
    cover_asset_id: z.number().int().positive().nullable().optional(),
    content_md: z.string().trim().max(20000, t('内容过长', 'Content is too long')),
  })
}

export const podcastFormSchema = createPodcastFormSchema('zh')
export type PodcastFormValues = z.infer<ReturnType<typeof createPodcastFormSchema>>
