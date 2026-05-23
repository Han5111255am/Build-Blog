import { fetchCurrentUser } from '@/features/auth/services/auth-api'
import { hydratePreferenceSettings } from '@/features/settings/services/preferences-session'
import { useAuthStore } from '@/stores/auth-store'

const AUTH_SESSION_TTL_MS = 5 * 60 * 1000

let ensureAuthSessionPromise: Promise<boolean> | null = null
let lastValidatedAt = 0

interface EnsureAuthSessionOptions {
  forceRefresh?: boolean
}

export function markAuthSessionValidated(validatedAt = Date.now()) {
  lastValidatedAt = validatedAt
}

export function hasPersistedAuthenticatedState() {
  const state = useAuthStore.getState()
  return state.isAuthenticated || Boolean(state.user)
}

export async function ensureAuthSession(options: EnsureAuthSessionOptions = {}): Promise<boolean> {
  const state = useAuthStore.getState()
  if (state.initialized && !options.forceRefresh && !state.isAuthenticated) {
    return state.isAuthenticated
  }

  if (state.initialized && state.isAuthenticated && !options.forceRefresh && !isAuthSessionRefreshDue()) {
    return true
  }

  if (!ensureAuthSessionPromise) {
    ensureAuthSessionPromise = restoreAuthSession().finally(() => {
      ensureAuthSessionPromise = null
    })
  }

  return ensureAuthSessionPromise
}

async function restoreAuthSession(): Promise<boolean> {
  const { clearAuth, setAuthenticatedUser, setInitialized } = useAuthStore.getState()

  try {
    const user = await fetchCurrentUser()
    if (user) {
      setAuthenticatedUser(user)
      await hydratePreferenceSettings()
      markAuthSessionValidated()
      return true
    }

    clearAuth()
    lastValidatedAt = 0
    return false
  } finally {
    setInitialized(true)
  }
}

function isAuthSessionRefreshDue(now = Date.now()) {
  return !lastValidatedAt || now - lastValidatedAt >= AUTH_SESSION_TTL_MS
}
