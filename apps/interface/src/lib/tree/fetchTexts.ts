import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://eth.llamarpc.com", {
    batch: {
      batchSize: 64,
    },
  }),
})

export async function fetchTexts(ensName: string, keys: string[]) {
  const calls = keys.map((key) =>
    client.getEnsText({
      name: ensName,
      key,
    })
  )
  const results = await Promise.all(calls)
  return Object.fromEntries(keys.map((k, i) => [k, results[i]]))
}
