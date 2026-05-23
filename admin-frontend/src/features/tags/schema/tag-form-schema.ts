import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

export function createTagFormSchema(language: AppLanguage) {
  const t = (zh: string, en: string) => pickText(language, zh, en)

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('请输入标签名称', 'Enter a tag name'))
      .max(60, t('标签名称长度不能超过 60 个字符', 'Tag name must be 60 characters or fewer')),
    slug: z
      .string()
      .trim()
      .max(120, t('slug 长度不能超过 120 个字符', 'Slug must be 120 characters or fewer'))
      .regex(/^[a-z0-9-]*$/, t('slug 仅允许小写字母、数字和中划线', 'Slug can only contain lowercase letters, numbers, and hyphens'))
      .or(z.literal('')),
    color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{6})$/, t('颜色值需为 #RRGGBB 格式', 'Color must use the #RRGGBB format')),
    description: z
      .string()
      .trim()
      .max(240, t('标签说明长度不能超过 240 个字符', 'Description must be 240 characters or fewer')),
  })
}

export const tagFormSchema = createTagFormSchema('zh')
export type TagFormValues = z.infer<ReturnType<typeof createTagFormSchema>>
