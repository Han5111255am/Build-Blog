import { useAuthStore } from '@/stores/auth-store'

function buildLoginUrl() {
  if (typeof window === 'undefined') {
    return '/login'
  }

  const redirectTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const query = new URLSearchParams({ redirect: redirectTarget })
  return `/login?${query.toString()}`
}

export function handleUnauthorizedSession() {
  useAuthStore.getState().clearAuth()

  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname === '/login') {
    return
  }

  window.location.assign(buildLoginUrl())
}
