import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

const languageOptions = ['zh', 'en'] as const

export function createPhotoFormSchema(language: AppLanguage) {
  const t = (zh: string, en: string) => pickText(language, zh, en)
  const languageField = z
    .string()
    .trim()
    .min(1, t('请选择语言', 'Select a language'))
    .refine((value): value is (typeof languageOptions)[number] => languageOptions.includes(value as (typeof languageOptions)[number]), {
      message: t('语言仅支持 zh 或 en', 'Language must be either zh or en'),
    })

  return z.object({
    caption: z
      .string()
      .trim()
      .min(1, t('请输入照片标题', 'Enter a caption'))
      .max(120, t('照片标题长度不能超过 120 个字符', 'Caption must be 120 characters or fewer')),
    slug: z
      .string()
      .trim()
      .max(120, t('Slug 长度不能超过 120 个字符', 'Slug must be 120 characters or fewer'))
      .regex(
        /^[a-z0-9-]*$/,
        t('Slug 仅允许小写字母、数字和中划线', 'Slug can only contain lowercase letters, numbers, and hyphens'),
      )
      .or(z.literal('')),
    lang: languageField,
    location: z
      .string()
      .trim()
      .max(120, t('地点长度不能超过 120 个字符', 'Location must be 120 characters or fewer')),
    taken_at: z.string().trim().min(1, t('请输入拍摄时间', 'Enter the taken time')),
    description: z
      .string()
      .trim()
      .max(800, t('描述长度不能超过 800 个字符', 'Description must be 800 characters or fewer')),
    original_url: z.string().trim().min(1, t('请选择原图素材', 'Choose the original asset')),
    thumbnail_url: z.string().trim().min(1, t('请选择缩略图素材', 'Choose the thumbnail asset')),
  })
}

export const photoFormSchema = createPhotoFormSchema('zh')
export type PhotoFormValues = z.infer<ReturnType<typeof createPhotoFormSchema>>
