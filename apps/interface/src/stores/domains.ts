import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useApiStore } from './api'
import { QUERY_DOMAINS_BY_ADDRESS } from '@/graphql/query.domains-by-address'


interface DomainsState {
  activeSpace: Space | null
  availableSpaces: Space[]
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  setActiveSpace: (space: Space | null) => void
  clearActiveSpace: () => void
  fetchSpaces: () => Promise<void>
  reset: () => void
}

export const useDomainsStore = create<DomainsState>()(
  persist(
    (set, get) => ({
      activeSpace: null,
      availableSpaces: [],
      isLoading: false,
      isInitialized: false,
      error: null,

      setActiveSpace: (space: Space | null) => {
        set({ activeSpace: space })
      },

      clearActiveSpace: () => {
        set({ activeSpace: null })
      },

      fetchSpaces: async () => {
        set({ isLoading: true, error: null })

        try {
          const apiStore = useApiStore.getState()
          const resp = await apiStore.request<TeamsResponse>(QUERY_TEAMS)

          console.log('fetchSpaces.resp', resp)

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
            isInitialized: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          console.error('Failed to fetch spaces:', error)
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch spaces',
          })
        }
      },

      reset: () => {
        set({
          activeSpace: null,
          availableSpaces: [],
          isLoading: false,
          isInitialized: false,
          error: null,
        })
      },
    }),
    {
      name: 'spaces-store',
      partialize: (state) => ({
        activeSpace: state.activeSpace,
        availableSpaces: state.availableSpaces,
        isInitialized: state.isInitialized,
      }),
    },
  ),
)

export type { DomainsState }
