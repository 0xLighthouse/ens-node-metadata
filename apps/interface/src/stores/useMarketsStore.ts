import { create } from 'zustand'
import { GraphQLClient } from 'graphql-request'
import { INDEXER_ENDPOINT } from '@/config/web3'
import { QUERY_MARKETS } from '../graphql/query.markets'
import {
  formatMaxBondDuration,
  type Harbor,
  type QueryMarketsArgs,
  type Erc20,
} from '@harbor/shared/graphql'
import { HarborMarket } from '@/app/components/harbor/types'

console.log(`INDEXER_ENDPOINT: ${INDEXER_ENDPOINT}`)
const client = new GraphQLClient(`${INDEXER_ENDPOINT}/graphql`)

interface MarketsState {
  markets: Map<string, HarborMarket>
  isFetchingMarkets: boolean
  isMarketsInitialized: boolean
  error?: string
  fetchMarkets: () => Promise<void>
  getMarket: (harborKey: string) => HarborMarket | undefined
  transform: (market: Harbor) => HarborMarket
}

const mapERC20 = (data: Erc20): Erc20 & { logo: string } => {
  return {
    ...data,
    logo: 'TODO',
  }
}

export const useMarketsStore = create<MarketsState>((set, get) => ({
  markets: new Map(),
  isFetchingMarkets: false,
  isMarketsInitialized: false,
  error: undefined,

  // TODO: We should really do this at the API level
  transform: (harbor: Harbor): HarborMarket => {
    console.log('transforming harbor', harbor)

    const maxAgeFormatted = formatMaxBondDuration(harbor.maxBondDuration)

    return {
      harborKey: harbor.harborKey,
      marketAddress: harbor.marketAddress,
      escrowToken: mapERC20(harbor.escrowToken),
      underlyingToken: mapERC20(harbor.underlyingToken),
      maxAgeFormatted: maxAgeFormatted,
      acceptedIssuers: harbor.acceptedIssuers,
      liquidity: 42069,
      volume: 42069,
      bondsInEscrow: harbor.harborStats.bondsInEscrow,
      averageTimeToMaturity: 42069,
    }
  },

  getMarket: (harborKey: string) => {
    return get().markets.get(harborKey)
  },

  fetchMarkets: async () => {
    // Prevent duplicate fetches
    if (get().isFetchingMarkets) return

    const variables: QueryMarketsArgs = {
      // chainId: context.network.baseSepolia.chainId,
      // TODO: This should be set from a React context
      chainId: 84532,
    }

    try {
      set({ isFetchingMarkets: true, error: undefined })
      const data = await client.request<{ markets: Harbor[] }>(QUERY_MARKETS, variables)
      const markets = data.markets ?? []

      set({
        markets: new Map(markets.map((m) => [m.harborKey, get().transform(m)])),
        isMarketsInitialized: true,
      })
    } catch (err) {
      console.error('Error fetching markets:', err)
      set({ markets: new Map(), error: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      set({ isFetchingMarkets: false, isMarketsInitialized: true })
    }
  },
}))
