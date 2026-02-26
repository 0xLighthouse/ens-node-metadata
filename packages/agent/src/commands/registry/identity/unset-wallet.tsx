import { Box, Text, useApp } from 'ink'
import React from 'react'
import { http, createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import IdentityRegistryABI from '../../../lib/abis/IdentityRegistry.json' with { type: 'json' }
import { SUPPORTED_CHAINS, resolveChain } from '../../../lib/registry.js'

export const description = 'Clear the verified wallet from an agent'

export const options = z.object({
  chainName: z
    .enum(SUPPORTED_CHAINS)
    .default('mainnet')
    .describe('Chain name (e.g. mainnet, base, arbitrum, optimism)'),
  privateKey: z
    .string()
    .describe('Private key for signing (hex, prefixed with 0x)'),
  broadcast: z
    .boolean()
    .default(false)
    .describe('Broadcast the transaction on-chain (default: dry run)'),
})

export const args = z.tuple([z.string().describe('agent-id (token ID)')])

type Props = {
  options: z.infer<typeof options>
  args: z.infer<typeof args>
}

type State =
  | { status: 'idle' }
  | { status: 'working'; message: string }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string }

export default function UnsetWallet({
  options: { chainName, privateKey, broadcast },
  args: [agentId],
}: Props) {
  const { exit } = useApp()
  const [state, setState] = React.useState<State>({ status: 'idle' })

  React.useEffect(() => {
    if (state.status === 'done') exit()
    else if (state.status === 'error') exit(new Error(state.message))
  }, [state, exit])

  React.useEffect(() => {
    async function run() {
      const { chain, registryAddress } = resolveChain(chainName)
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      const tokenId = BigInt(agentId)

      if (!broadcast) {
        setState({
          status: 'done',
          message: [
            `Dry run — would call unsetAgentWallet on ${chainName}:`,
            '',
            `  Registry:  ${registryAddress}`,
            `  Agent ID:  ${tokenId.toString()}`,
            `  Signer:    ${account.address}`,
            '',
            'Run with --broadcast to submit on-chain.',
          ].join('\n'),
        })
        return
      }

      setState({ status: 'working', message: `Clearing wallet on ${chainName}…` })

      try {
        const publicClient = createPublicClient({ chain, transport: http() })
        const walletClient = createWalletClient({ account, chain, transport: http() })

        const { request } = await publicClient.simulateContract({
          account,
          address: registryAddress,
          abi: IdentityRegistryABI,
          functionName: 'unsetAgentWallet',
          args: [tokenId],
        })

        const txHash = await walletClient.writeContract(request)

        setState({
          status: 'done',
          message: [
            `✅ Wallet cleared on ${chainName}`,
            `   Agent ID: ${tokenId.toString()}`,
            `   Tx Hash:  ${txHash}`,
          ].join('\n'),
        })
      } catch (err) {
        setState({
          status: 'error',
          message: `unsetAgentWallet failed: ${(err as Error).message}`,
        })
      }
    }

    run()
  }, [chainName, privateKey, broadcast, agentId])

  return (
    <Box flexDirection="column">
      {state.status === 'idle' && <Text color="gray">Preparing…</Text>}
      {state.status === 'working' && <Text color="cyan">{state.message}</Text>}
      {state.status === 'done' && <Text color="green">{state.message}</Text>}
      {state.status === 'error' && <Text color="red">❌ {state.message}</Text>}
    </Box>
  )
}
