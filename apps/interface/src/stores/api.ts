import { create } from 'zustand'
import { GraphQLClient } from 'graphql-request'
import Cookies from 'js-cookie'
import { toast } from 'sonner'

import { TOKEN_COOKIE, API_ENDPOINT } from '@/config/constants'
import { resolveApiError } from '@/lib/api/utils/resolveApiError'

interface ApiState {
  client: GraphQLClient
  request: <T>(query: string, variables?: any) => Promise<T>
  publicRequest: <T>(query: string, variables?: any) => Promise<T>
  handleServerError: (error: unknown) => void
  handleRequestError: (error: unknown) => void
  isRequestError: (error?: unknown) => boolean
  logout: () => void
}

export const useApiStore = create<ApiState>((set, get) => ({
  client: new GraphQLClient(`${API_ENDPOINT}/graphql`),

  request: async <T>(query: string, variables = {}): Promise<T> => {
    try {
      const token = Cookies.get(TOKEN_COOKIE)
      return await get().client.request<T>(query, variables, {
        authorization: token ? `Bearer ${token}` : undefined,
      })
    } catch (error) {
      console.error(error)
      get().handleRequestError(error)
      throw error?.response?.errors || error
    }
  },

  publicRequest: async <T>(query: string, variables = {}): Promise<T> => {
    try {
      return await get().client.request<T>(query, variables)
    } catch (error) {
      console.error(error)
      get().handleRequestError(error)
      throw error?.response?.errors || error
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
    const errStr = error?.toString().toLowerCase()
    if (errStr?.includes('network request failed')) {
      toast.error('Unable to contact server')
      get().logout()
    }
    if (errStr?.includes('invalid or expired token')) {
      toast.error('Invalid or expired token')
      get().logout()
    }
  },

  isRequestError: (error?: unknown) => {
    const errStr = error?.toString().toLowerCase()
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

// Export a singleton instance for cases where you need the API client directly
export const apiStore = useApiStore.getState()