import { FormEvent, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  initializeAuthCsrf,
  loginWithPassword,
} from '@/features/auth/services/auth-api'
import { markAuthSessionValidated } from '@/features/auth/services/auth-session'
import { useTranslation } from '@/features/i18n/use-translation'
import { hydratePreferenceSettings } from '@/features/settings/services/preferences-session'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiErrorResponse } from '@/types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const login = useAuthStore((state) => state.login)
  const { t, tt } = useTranslation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectRaw = search.redirect
  const redirectTo = typeof redirectRaw === 'string' ? redirectRaw : ''

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await initializeAuthCsrf()
      const response = await loginWithPassword({ username, password })
      login(response.data)
      markAuthSessionValidated()
      await hydratePreferenceSettings()

      if (redirectTo) {
        window.location.assign(redirectTo)
        return
      }

      await navigate({ to: '/dashboard' })
    } catch (error) {
      const apiError = error as ApiErrorResponse
      const mappedError =
        apiError.errors?.non_field_errors?.[0] ??
        apiError.errors?.username?.[0] ??
        apiError.errors?.password?.[0]

      setError(
        mappedError
          ? tt(mappedError)
          : apiError.message
            ? tt(apiError.message)
            : t('登录失败，请稍后重试。', 'Sign in failed. Please try again later.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[16px] bg-text text-sm font-bold text-surface shadow-soft">
          H
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">
          {t('\u540e\u53f0\u5165\u53e3', 'Admin Access')}
        </p>
        <h1 className="text-[2rem] font-semibold tracking-tight text-text sm:text-[2.25rem]">
          {t('登录后台', 'Sign In')}
        </h1>
        <p className="mx-auto max-w-[23rem] text-[14px] leading-6 text-muted">
          {t('请输入账号和密码登录后台。', 'Sign in with your account credentials.')}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          autoComplete="username"
          className="h-12"
          label={t('用户名', 'Username')}
          onValueChange={setUsername}
          placeholder={t('请输入用户名', 'Enter your username')}
          value={username}
        />
        <Input
          autoComplete="current-password"
          className="h-12"
          label={t('密码', 'Password')}
          onValueChange={setPassword}
          placeholder={t('请输入密码', 'Enter your password')}
          type="password"
          value={password}
        />

        {error ? (
          <p className="rounded-[14px] border border-[rgba(208,68,68,0.18)] bg-[rgba(208,68,68,0.08)] px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="pt-1">
          <Button
            className="w-full"
            loading={submitting}
            type="submit"
          >
            {t('登录', 'Sign In')}
          </Button>
        </div>
      </form>
    </div>
  )
}
