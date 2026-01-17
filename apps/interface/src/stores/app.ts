import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { TOKEN_COOKIE } from '@/config/constants'
import { useApiStore } from './api'
import { QUERY_TEAMS } from '@/graphql/query.teams'


interface User {
  id?: string
  address?: string
  email?: string
}

interface TeamsResponse {
  me: {
    status: string
    createdAt: string
    accounts: Array<{
      accountId: string
      address: string
      teams: Array<{
        role: string
        space: Space
      }>
    }>
  }
}

type AppStatus = 'idle' | 'initializing' | 'loading-spaces' | 'ready' | 'error'

interface AppState {
  // Auth state
  user: User | null
  token: string | null
  isAuthenticated: boolean

  // Spaces state
  activeSpace: Space | null
  availableSpaces: Space[]

  // App state
  status: AppStatus
  error: string | null

  // Actions
  initialize: () => Promise<void>
  setBearerToken: (token: string) => void
  setUser: (user: User) => void
  setActiveSpace: (space: Space | null) => void
  clearActiveSpace: () => void
  fetchSpaces: () => Promise<void>
  logout: () => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      activeSpace: null,
      availableSpaces: [],
      status: 'idle',
      error: null,

      initialize: async () => {
        console.log('AppStore.initialize')
        set({ status: 'initializing' })

        try {
          const token = Cookies.get(TOKEN_COOKIE)

          if (token) {
            set({
              token,
              isAuthenticated: true,
              status: 'loading-spaces'
            })

            // Fetch spaces after authentication is confirmed
            await get().fetchSpaces()
            set({ status: 'ready' })
          } else {
            set({ status: 'ready' })
          }
        } catch (error) {
          console.error('AppStore initialization error:', error)
          set({
            status: 'error',
            error: error instanceof Error ? error.message : 'Initialization failed'
          })
        }
      },

      setBearerToken: (token: string) => {
        if (token) {
          Cookies.set(TOKEN_COOKIE, token, { expires: 7 })
          set({
            token,
            isAuthenticated: true,
            status: 'loading-spaces'
          })

          // Fetch spaces after setting token
          get().fetchSpaces().then(() => {
            set({ status: 'ready' })
          }).catch((error) => {
            console.error('Failed to fetch spaces after login:', error)
            set({ status: 'error', error: 'Failed to load spaces' })
          })
        } else {
          get().reset()
        }
      },

      setUser: (user: User) => {
        set({ user })
      },

      setActiveSpace: (space: Space | null) => {
        set({ activeSpace: space })
      },

      clearActiveSpace: () => {
        set({ activeSpace: null })
      },

      fetchSpaces: async () => {
        const { isAuthenticated, token } = get()

        if (!isAuthenticated || !token) {
          console.warn('AppStore.fetchSpaces: Not authenticated')
          return
        }

        try {
          const apiStore = useApiStore.getState()
          const resp = await apiStore.request<TeamsResponse>(QUERY_TEAMS)

          console.log('AppStore.fetchSpaces.resp', resp)

          // Extract all spaces from all accounts and teams
          const spaces: Space[] = []
          for (const account of resp.me.accounts) {
            for (const team of account.teams) {
              if (team.space) {
                spaces.push(team.space)
              }
            }
          }

          set({
            availableSpaces: spaces,
            error: null,
          })
        } catch (error) {
          console.error('AppStore.fetchSpaces error:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch spaces',
          })
        }
      },

      logout: () => {
        console.log('AppStore.logout')

        // Clear cookie
        Cookies.remove(TOKEN_COOKIE)

        // Reset all state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeSpace: null,
          availableSpaces: [],
          status: 'ready',
          error: null,
        })

        // Clear persisted data
        localStorage.removeItem('app-store')

        // Optional: redirect to login/home page
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      },

      reset: () => {
        // Internal reset method (for initialization failures, etc.)
        Cookies.remove(TOKEN_COOKIE)
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeSpace: null,
          availableSpaces: [],
          status: 'ready',
          error: null,
        })
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        user: state.user,
        activeSpace: state.activeSpace,
        // Don't persist availableSpaces - always fetch fresh
      }),
    },
  ),
)

// Initialize the store on client side
if (typeof window !== 'undefined') {
  useAppStore.getState().initialize()
}

export type { User, Space, AppState, AppStatus }
