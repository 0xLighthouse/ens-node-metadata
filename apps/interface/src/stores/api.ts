import { create } from 'zustand'
import { GraphQLClient } from 'graphql-request'
import { toast } from 'sonner'

import { resolveApiError } from '@/lib/api/utils/resolveApiError'

interface ApiState {
  client: GraphQLClient
  ensSubgraph: GraphQLClient
  publicRequest: <T>(query: string, variables?: any) => Promise<T>
  ensRequest: <T>(query: string, variables?: any) => Promise<T>
  handleServerError: (error: unknown) => void
  handleRequestError: (error: unknown) => void
  isRequestError: (error?: unknown) => boolean
  logout: () => void
}

export const useApiStore = create<ApiState>((set, get) => ({
  client: new GraphQLClient('NOT_IMPLEMENTED/graphql'),

  ensSubgraph: new GraphQLClient('https://api.alpha.ensnode.io/subgraph'),

  ensRequest: async <T>(query: string, variables = {}): Promise<T> => {
    try {
      return await get().ensSubgraph.request<T>(query, variables)
    } catch (error) {
      console.error(error)
      get().handleRequestError(error)
      throw (error as any)?.response?.errors || error
    }
  },


  publicRequest: async <T>(query: string, variables = {}): Promise<T> => {
    try {
      return await get().client.request<T>(query, variables)
    } catch (error) {
      console.error(error)
      get().handleRequestError(error)
      throw (error as any)?.response?.errors || error
    }
  },

  handleServerError: (error: unknown) => {
    if (!get().isRequestError(error)) {
      console.error(error)

      // Note: Sentry is not installed in this project
      // If you want to add Sentry, install @sentry/nextjs and uncomment:
      // Sentry.captureException(error)

      const resolvedError = resolveApiError(error)
      toast.error(resolvedError.message)
    }
  },

  handleRequestError: (error: unknown) => {
    const errStr = (error as any)?.toString().toLowerCase()
    if (errStr?.includes('network request failed')) {
      toast.error('Unable to contact server')
      get().logout()
    }
    if (errStr?.includes('invalid or expired token')) {
      toast.error('Invalid or expired token')
      get().logout()
    }
  },

  isRequestError: (error?: unknown): boolean => {
    const errStr = (error as any)?.toString().toLowerCase()
    return (
      errStr?.includes('network request failed') ||
      errStr?.includes('invalid or expired token')
    )
  },

  logout: () => {
    // Import useAppStore dynamically to avoid circular dependencies
    import('./app').then(({ useAppStore }) => {
      useAppStore.getState().logout()
    })
  },
}))

// Export a singleton instance for cases where we need the API client directly without Zustand
export const apiStore = useApiStore.getState()
