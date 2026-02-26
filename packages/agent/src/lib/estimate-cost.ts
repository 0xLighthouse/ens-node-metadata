import { formatEther, type EstimateGasParameters, type PublicClient } from 'viem'

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

/** Cached ETH/USD price with a 60-second TTL. */
let priceCache: { usd: number; ts: number } | null = null
const CACHE_TTL_MS = 60_000

async function getEthUsdPrice(): Promise<number> {
  if (priceCache && Date.now() - priceCache.ts < CACHE_TTL_MS) {
    return priceCache.usd
  }

  const res = await fetch(COINGECKO_URL)
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`)

  const data = (await res.json()) as { ethereum: { usd: number } }
  const usd = data.ethereum.usd
  priceCache = { usd, ts: Date.now() }
  return usd
}

export type CostEstimate = {
  gas: bigint
  maxFeePerGas: bigint
  costWei: bigint
  costEth: string
  costUsd: string
  ethUsdPrice: number
}

/**
 * Estimate the cost of a transaction in ETH and USD.
 *
 * Pass the same transaction parameters you'd send to `writeContract` or
 * `sendTransaction`. The function estimates gas, fetches fee data and the
 * current ETH/USD price, then returns everything you need to present a
 * confirmation prompt.
 */
export async function estimateCost(
  client: PublicClient,
  tx: EstimateGasParameters,
): Promise<CostEstimate> {
  const [gas, fees, ethUsdPrice] = await Promise.all([
    client.estimateGas(tx),
    client.estimateFeesPerGas(),
    getEthUsdPrice(),
  ])

  const maxFeePerGas = fees.maxFeePerGas ?? 0n
  const costWei = gas * maxFeePerGas
  const costEthNum = Number(formatEther(costWei))

  return {
    gas,
    maxFeePerGas,
    costWei,
    costEth: formatEther(costWei),
    costUsd: (costEthNum * ethUsdPrice).toFixed(2),
    ethUsdPrice,
  }
}

/** One-liner for display: "$0.42 (0.00025 ETH)" */
export function formatCost(est: CostEstimate): string {
  // Trim trailing zeros for a cleaner ETH display
  const eth = Number.parseFloat(est.costEth).toPrecision(4)
  return `$${est.costUsd} (${eth} ETH)`
}
