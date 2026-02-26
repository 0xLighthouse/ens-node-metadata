import { http, createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'

export type TextRecord = { key: string; value: string }

export async function setEnsTextRecords(
  ensName: string,
  texts: TextRecord[],
  privateKey: string,
): Promise<string> {
  const { addEnsContracts } = await import('@ensdomains/ensjs')
  const { setRecords } = await import('@ensdomains/ensjs/wallet')
  const { getResolver } = await import('@ensdomains/ensjs/public')

  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const chain = addEnsContracts(mainnet)

  const publicClient = createPublicClient({ chain, transport: http() })
  const walletClient = createWalletClient({ account, chain, transport: http() })

  const resolverAddress = await getResolver(publicClient, { name: ensName })
  if (!resolverAddress) {
    throw new Error(`No resolver found for ${ensName}. Set a resolver first.`)
  }

  const hash = await setRecords(walletClient, {
    name: ensName,
    texts,
    coins: [],
    resolverAddress,
  })

  return hash
}
