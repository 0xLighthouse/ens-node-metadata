import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { TOKEN_COOKIE } from '@/config/constants'
import { useSpacesStore } from './spaces'

interface User {
  id?: string
  address?: string
  email?: string
  // Add other user properties as needed
}

interface SessionState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  setBearerToken: (token: string) => void
  setUser: (user: User) => void
  reset: () => void
  initialize: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      setBearerToken: (token: string) => {
        if (token) {
          Cookies.set(TOKEN_COOKIE, token, { expires: 7 }) // 7 days
          set({ token, isAuthenticated: true })
        } else {
          Cookies.remove(TOKEN_COOKIE)
          set({ token: null, isAuthenticated: false, user: null })
        }
      },

      setUser: (user: User) => {
        set({ user })
      },

      reset: () => {
        Cookies.remove(TOKEN_COOKIE)
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        })

        // --- reset other stores ---
        // Use a small timeout to ensure state updates are batched properly
        setTimeout(() => {
          useSpacesStore.getState().reset?.()
        }, 0)

        // No redirect needed - AuthGate will handle UI change automatically
      },

      initialize: () => {
        const token = Cookies.get(TOKEN_COOKIE)

        console.log('initialize.token', token)
        if (token !== undefined && token !== null) {
          set({ token, isAuthenticated: true })
        }
      },
    }),
    {
      name: 'session-store',
      partialize: (state) => ({
        user: state.user, // Only persist user data, not auth status
      }),
    },
  ),
)

// Initialize the store on client side
if (typeof window !== 'undefined') {
  useSessionStore.getState().initialize()
}
