
import { createPublicClient, GetEnsNameReturnType, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum-rpc.publicnode.com', {
    batch: {
      batchSize: 1024,
    },
  }),
})

type Address = `0x${string}`
type ENSNameByAddress = Map<Address, GetEnsNameReturnType>

export async function mapNamesByAddress(addresses: `0x${string}`[]): Promise<ENSNameByAddress> {
  const calls = addresses.map((address) => client.getEnsName({ address }))
  const names = await Promise.all(calls)
  return new Map(addresses.map((address, index) => [address, names[index]]))
}
