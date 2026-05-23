import { z } from 'zod'
import { pickText } from '@/features/i18n/translation'
import type { AppLanguage } from '@/stores/ui-preferences'

export function createAccountProfileFormSchema(language: AppLanguage) {
  const t = (zh: string, en: string) => pickText(language, zh, en)

  return z.object({
    username: z
      .string()
      .trim()
      .min(3, t('账号长度至少 3 个字符', 'Username must be at least 3 characters'))
      .max(32, t('账号长度不能超过 32 个字符', 'Username must be 32 characters or fewer'))
      .regex(/^[a-zA-Z0-9_.-]+$/, t('账号仅允许字母、数字、下划线、点和中划线', 'Username can only contain letters, numbers, underscores, dots, and hyphens')),
    display_name: z
      .string()
      .trim()
      .min(2, t('显示名称至少 2 个字符', 'Display name must be at least 2 characters'))
      .max(32, t('显示名称长度不能超过 32 个字符', 'Display name must be 32 characters or fewer')),
  })
}

export function createPasswordFormSchema(language: AppLanguage) {
  const t = (zh: string, en: string) => pickText(language, zh, en)

  return z
    .object({
      current_password: z.string().min(1, t('请输入当前密码', 'Enter the current password')),
      new_password: z
        .string()
        .min(8, t('新密码至少 8 个字符', 'New password must be at least 8 characters'))
        .max(64, t('新密码长度不能超过 64 个字符', 'New password must be 64 characters or fewer'))
        .regex(/[A-Za-z]/, t('新密码至少包含一个字母', 'New password must contain at least one letter'))
        .regex(/\d/, t('新密码至少包含一个数字', 'New password must contain at least one number')),
      confirm_password: z.string().min(1, t('请再次输入新密码', 'Re-enter the new password')),
    })
    .refine((values) => values.new_password !== values.current_password, {
      message: t('新密码不能与当前密码相同', 'New password cannot match the current password'),
      path: ['new_password'],
    })
    .refine((values) => values.new_password === values.confirm_password, {
      message: t('两次输入的新密码不一致', 'The new passwords do not match'),
      path: ['confirm_password'],
    })
}

export const accountProfileFormSchema = createAccountProfileFormSchema('zh')
export const passwordFormSchema = createPasswordFormSchema('zh')
export type AccountProfileSchemaValues = z.infer<ReturnType<typeof createAccountProfileFormSchema>>
export type PasswordSchemaValues = z.infer<ReturnType<typeof createPasswordFormSchema>>
