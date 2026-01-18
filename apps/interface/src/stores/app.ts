import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { AUTH_TOKEN_COOKIE } from '@/config/constants'
import { useApiStore } from './api'
import { QUERY_DOMAINS_BY_ADDRESS } from '@/graphql/query.domains-by-address'
import { ENSRootDomain } from '@/types'
import { User } from '@privy-io/react-auth'

type AppStatus = 'idle' | 'initializing' | 'loading-domains' | 'ready' | 'error'

interface AppState {
  isInitialized: boolean
  user: User | undefined

  // Spaces state
  activeDomain: ENSRootDomain | null
  registeredDomains: ENSRootDomain[]

  // App state
  status: AppStatus
  error: string | null


  initialize: (user: User) => Promise<void>
  setActiveDomain: (domain: ENSRootDomain) => void
  clearActiveDomain: () => void
  fetchDomains: (userAddress: string) => Promise<void>
  logout: () => void
  reset: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      user: undefined,
      activeDomain: null,
      registeredDomains: [],
      status: 'idle',
      error: null,

      initialize: async (user: User) => {
        console.log('AppStore.initialize')
        set({ status: 'initializing', user })

        try {
          set({
            status: 'loading-domains'
          })
          await get().fetchDomains(user.wallet?.address)
          set({ status: 'ready', isInitialized: true })
        } catch (error) {
          console.error('AppStore initialization error:', error)
          set({
            status: 'error',
            error: error instanceof Error ? error.message : 'Initialization failed'
          })
        }
      },

      setActiveDomain: (domain: ENSRootDomain) => {
        set({ activeDomain: domain })
      },

      clearActiveDomain: () => {
        set({ activeDomain: null })
      },

      fetchDomains: async (userAddress: string) => {

        console.log('AppStore.fetchDomains.userAddress', userAddress)

        try {
          const apiStore = useApiStore.getState()
          const resp = await apiStore.ensRequest(QUERY_DOMAINS_BY_ADDRESS, { address: userAddress })

          console.log('AppStore.fetchDomains.resp', resp)

          // Transform shitty subgraph response to our types
          const domains: ENSRootDomain[] = []
          for (const item of resp.domains) {
            domains.push({
              id: item.id,
              label: item.labelName,
              name: item.name,
              namehash: item.id,
              createdAt: item.createdAt,
              expiryDate: item.expiryDate,
              isMigrated: item.isMigrated,
            })
          }

          set({
            registeredDomains: domains,
            error: null,
          })
        } catch (error) {
          console.error('AppStore.fetchDomains error:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch domains',
          })
        }
      },

      logout: () => {
        console.log('AppStore.logout')

        // Clear cookie
        Cookies.remove(AUTH_TOKEN_COOKIE)

        // Reset all state
        set({
          activeDomain: null,
          registeredDomains: [],
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
        set({
          activeDomain: null,
          registeredDomains: [],
          status: 'ready',
          error: null,
        })
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        activeDomain: state.activeDomain,
        // Don't persist registeredDomains - always fetch fresh
      }),
    },
  ),
)

export type { AppState, AppStatus }
