import { create } from 'zustand'
import { GraphQLClient } from 'graphql-request'
import { INDEXER_ENDPOINT } from '@/config/web3'
import { getSdk } from '@harbor/shared'

const client = new GraphQLClient(`${INDEXER_ENDPOINT}/graphql`)
const sdk = getSdk(client)

interface HarborState {
  bonds: Map<string, unknown>
  isFetching: boolean
  isInitialized: boolean
  error?: string
  fetchBonds: (harborKey: string, address: `0x${string}`) => Promise<void>
}

export const useHarborStore = create<HarborState>((set, get) => ({
  bonds: new Map(),
  isFetching: false,
  isInitialized: false,
  error: undefined,

  /**
   * Fetch all bonds for a given harbor.
   * @param harborKey - The key of the harbor to fetch bonds for.
   * @param address - The address of the user to fetch bonds for.
   */
  fetchBonds: async (harborKey: string, address: `0x${string}`) => {
    // Prevent duplicate fetches
    if (get().isFetching) return

    set({ isFetching: true })

    try {
      const result = await sdk.Bonds({ harborKey, address })
      console.log('result', result)

      set({
        bonds: new Map(result.bonds.map((b) => [b.id, b])),
        isFetching: false,
        isInitialized: true,
      })
    } catch (err) {
      console.error('Error fetching bonds:', err)
      set({
        bonds: new Map(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      set({ isFetching: false, isInitialized: true })
    }
  },
}))
