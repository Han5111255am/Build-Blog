import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AuthUser {
  id: number
  username: string
  displayName: string
  roles: string[]
}

interface AuthStoreState {
  initialized: boolean
  isAuthenticated: boolean
  user: AuthUser | null
  login: (user: AuthUser) => void
  setAuthenticatedUser: (user: AuthUser) => void
  setInitialized: (initialized: boolean) => void
  updateUser: (payload: Partial<AuthUser>) => void
  logout: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      initialized: false,
      isAuthenticated: false,
      user: null,
      login: (user) => set({ initialized: true, isAuthenticated: true, user }),
      setAuthenticatedUser: (user) =>
        set({ initialized: true, isAuthenticated: true, user }),
      setInitialized: (initialized) => set({ initialized }),
      updateUser: (payload) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...payload } : state.user,
        })),
      logout: () => set({ initialized: true, isAuthenticated: false, user: null }),
      clearAuth: () => set({ initialized: true, isAuthenticated: false, user: null }),
    }),
    {
      name: 'admin-frontend-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
)
