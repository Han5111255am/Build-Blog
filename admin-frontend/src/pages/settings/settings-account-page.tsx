import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import {
  createAccountProfileFormSchema,
  createPasswordFormSchema,
  type AccountProfileSchemaValues,
  type PasswordSchemaValues,
} from '@/features/settings/schema/account-settings-form-schema'
import {
  updateAccountProfile,
  updatePassword,
} from '@/features/settings/services/account-settings-api'
import type {
  AccountProfileFormValues,
  PasswordFormValues,
} from '@/features/settings/types/account-settings'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiErrorResponse } from '@/types/api'
import { applyServerFieldErrors } from '@/utils/apply-server-field-errors'

export function SettingsAccountPage() {
  const { pushToast } = useToast()
  const { language, t, tt, translateOptional } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const profileSchema = useMemo(() => createAccountProfileFormSchema(language), [language])
  const passwordSchema = useMemo(() => createPasswordFormSchema(language), [language])

  const profileForm = useForm<AccountProfileSchemaValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? 'admin',
      display_name: user?.displayName ?? 'Admin',
    },
    mode: 'onBlur',
  })

  const passwordForm = useForm<PasswordSchemaValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    profileForm.reset({
      username: user?.username ?? 'admin',
      display_name: user?.displayName ?? 'Admin',
    })
  }, [profileForm, user?.displayName, user?.username])

  const profileMutation = useMutation({
    mutationFn: (payload: AccountProfileFormValues) => updateAccountProfile(payload),
    onSuccess: (response, variables) => {
      updateUser({
        username: response.data.username,
        displayName: response.data.display_name,
      })
      profileForm.reset(variables)
      pushToast({
        title: t('账号资料已保存', 'Profile Saved'),
        description: translateOptional(response.message),
        tone: 'success',
      })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<AccountProfileSchemaValues>(apiError.errors, profileForm.setError)
      pushToast({
        title: t('账号资料保存失败', 'Failed to Save Profile'),
        description: translateOptional(apiError.message) || t('请检查输入后重试', 'Check the input and try again.'),
        tone: 'error',
      })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (payload: PasswordFormValues) => updatePassword(payload),
    onSuccess: (response) => {
      passwordForm.reset({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      pushToast({
        title: t('密码修改成功', 'Password Updated'),
        description: translateOptional(response.message),
        tone: 'success',
      })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      applyServerFieldErrors<PasswordSchemaValues>(apiError.errors, passwordForm.setError)
      pushToast({
        title: t('密码修改失败', 'Failed to Update Password'),
        description: translateOptional(apiError.message) || t('请检查输入后重试', 'Check the input and try again.'),
        tone: 'error',
      })
    },
  })

  const profileValues = profileForm.watch()
  const passwordValue = passwordForm.watch('new_password')
  const passwordStrength = resolvePasswordStrength(passwordValue)

  return (
    <div className="space-y-6">
      <PageHeader
        description={t(
          '维护账号资料并更新登录密码。',
          'Manage profile details and update the sign-in password.',
        )}
        eyebrow={t('设置', 'Settings')}
        meta={t('账号安全信息仅在当前管理后台内更新。', 'Account security changes stay within the admin system.')}
        title={t('账号与密码', 'Account & Password')}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
              {t('账号资料', 'Account')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text">
              {t('账号资料', 'Account Profile')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t('更新用户名和显示名称。', 'Update the username and display name.')}
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={profileForm.handleSubmit(async (data) => {
              await profileMutation.mutateAsync(data)
            })}
          >
            <Input
              autoComplete="username"
              error={profileForm.formState.errors.username?.message}
              label={t('账号名', 'Username')}
              onValueChange={(value) =>
                profileForm.setValue('username', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              placeholder={t('请输入账号名', 'Enter username')}
              value={profileValues.username}
            />
            <Input
              autoComplete="name"
              error={profileForm.formState.errors.display_name?.message}
              label={t('显示名称', 'Display Name')}
              onValueChange={(value) =>
                profileForm.setValue('display_name', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              placeholder={t('请输入显示名称', 'Enter display name')}
              value={profileValues.display_name}
            />

            <div className="rounded-[18px] border border-border bg-background/70 px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-medium text-text">
                  {t('当前登录信息', 'Current Session')}
                </p>
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                  {t('当前账号', 'Current Account')}
                </span>
              </div>
              <dl className="mt-3.5 grid gap-2.5 text-sm sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {t('用户名', 'Username')}
                  </dt>
                  <dd className="mt-1 truncate font-medium text-text">
                    {user?.username ?? 'admin'}
                  </dd>
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {t('显示名称', 'Display Name')}
                  </dt>
                  <dd className="mt-1 truncate font-medium text-text">
                    {user?.displayName ?? 'Admin'}
                  </dd>
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {t('角色', 'Role')}
                  </dt>
                  <dd className="mt-1 truncate font-medium text-text">
                    {user?.roles.join(', ') ?? 'superuser'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-5 text-muted sm:max-w-[62%]">
                {profileForm.formState.isDirty
                  ? t('你有尚未保存的账号资料修改。', 'You have unsaved profile changes.')
                  : t(
                      '账号资料当前已与本地登录态保持一致。',
                      'Profile details are currently aligned with the local session.',
                    )}
              </p>
              <Button
                className="min-w-[144px] self-end rounded-[18px] px-5 sm:self-auto"
                loading={profileMutation.isPending}
                type="submit"
              >
                {t('保存账号资料', 'Save Profile')}
              </Button>
            </div>
          </form>
        </article>

        <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
            {t('修改密码', 'Security')}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-text">
            {t('修改密码', 'Change Password')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t(
              '提交前会校验当前密码、新密码和确认密码。',
              'The current password, new password, and confirmation are validated before submission.',
            )}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={passwordForm.handleSubmit(async (data) => {
              await passwordMutation.mutateAsync(data)
            })}
          >
            <input
              autoComplete="username"
              className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
              defaultValue={user?.username ?? 'admin'}
              name="username"
              readOnly
              tabIndex={-1}
              type="text"
            />
            <Input
              autoComplete="current-password"
              error={passwordForm.formState.errors.current_password?.message}
              label={t('当前密码', 'Current Password')}
              onValueChange={(value) =>
                passwordForm.setValue('current_password', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              placeholder={t('请输入当前密码', 'Enter current password')}
              type="password"
              value={passwordForm.watch('current_password')}
            />
            <Input
              autoComplete="new-password"
              error={passwordForm.formState.errors.new_password?.message}
              label={t('新密码', 'New Password')}
              onValueChange={(value) =>
                passwordForm.setValue('new_password', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              placeholder={t('至少 8 位，包含字母和数字', 'At least 8 characters with letters and numbers')}
              type="password"
              value={passwordForm.watch('new_password')}
            />
            <Input
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirm_password?.message}
              label={t('确认新密码', 'Confirm New Password')}
              onValueChange={(value) =>
                passwordForm.setValue('confirm_password', value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              placeholder={t('请再次输入新密码', 'Re-enter the new password')}
              type="password"
              value={passwordForm.watch('confirm_password')}
            />

            <div className="rounded-[20px] border border-border bg-background/70 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text">
                  {t('密码强度', 'Password Strength')}
                </p>
                <span className={passwordStrength.badgeClass}>{tt(passwordStrength.label)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                <div className={passwordStrength.barClass} style={{ width: passwordStrength.width }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                {t(
                  '建议使用至少 8 位、同时包含字母和数字的密码。',
                  'Use at least 8 characters and include both letters and numbers.',
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-5 text-muted sm:max-w-[62%]">
                {t('修改后请使用新密码登录。', 'Use the new password the next time you sign in.')}
              </p>
              <Button
                className="min-w-[132px] self-end rounded-[18px] px-5 sm:self-auto"
                loading={passwordMutation.isPending}
                type="submit"
              >
                {t('更新密码', 'Update Password')}
              </Button>
            </div>
          </form>
        </article>
      </section>
    </div>
  )
}

function resolvePasswordStrength(password: string) {
  if (!password) {
    return {
      label: '未输入',
      width: '0%',
      badgeClass: 'rounded-full border border-white/20 px-2.5 py-1 text-xs text-muted',
      barClass: 'h-full rounded-full bg-transparent',
    }
  }

  const score =
    Number(password.length >= 8) +
    Number(/[A-Za-z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password))

  if (score <= 1) {
    return {
      label: '较弱',
      width: '28%',
      badgeClass:
        'rounded-full border border-[rgba(210,84,109,0.18)] px-2.5 py-1 text-xs text-[#d2546d]',
      barClass: 'h-full rounded-full bg-[linear-gradient(90deg,_#d2546d,_#f18972)]',
    }
  }

  if (score <= 3) {
    return {
      label: '中等',
      width: '64%',
      badgeClass:
        'rounded-full border border-[rgba(200,138,46,0.18)] px-2.5 py-1 text-xs text-warning',
      barClass: 'h-full rounded-full bg-[linear-gradient(90deg,_#c88a2e,_#f0b35f)]',
    }
  }

  return {
    label: '较强',
    width: '100%',
    badgeClass:
      'rounded-full border border-[rgba(47,158,111,0.18)] px-2.5 py-1 text-xs text-success',
    barClass: 'h-full rounded-full bg-[linear-gradient(90deg,_#2f9e6f,_#6bd3ac)]',
  }
}
