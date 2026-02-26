import { Box, Text, useApp } from 'ink'
import React from 'react'
import { http, createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import IdentityRegistryABI from '../../../lib/abis/IdentityRegistry.json' with { type: 'json' }
import { SUPPORTED_CHAINS, resolveChain } from '../../../lib/registry.js'

export const description = 'Register agent identity on ERC-8004 registry'

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

export const args = z.tuple([z.string().describe('agent-uri (e.g. ipfs://...)')])

type Props = {
  options: z.infer<typeof options>
  args: z.infer<typeof args>
}

type State =
  | { status: 'idle' }
  | { status: 'working'; message: string }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string }

export default function Register({
  options: { chainName, privateKey, broadcast },
  args: [agentUri],
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

      if (!broadcast) {
        setState({
          status: 'done',
          message: [
            `Dry run — would call register on ${chainName}:`,
            '',
            `  Registry:  ${registryAddress}`,
            `  Agent URI: ${agentUri}`,
            `  Signer:    ${account.address}`,
            '',
            'Run with --broadcast to submit on-chain.',
          ].join('\n'),
        })
        return
      }

      setState({ status: 'working', message: `Registering agent on ${chainName}…` })

      try {
        const publicClient = createPublicClient({ chain, transport: http() })
        const walletClient = createWalletClient({
          account,
          chain,
          transport: http(),
        })

        const { request } = await publicClient.simulateContract({
          account,
          address: registryAddress,
          abi: IdentityRegistryABI,
          functionName: 'register',
          args: [agentUri],
        })

        const txHash = await walletClient.writeContract(request)

        setState({
          status: 'done',
          message: [
            `✅ Agent registered on ${chainName}`,
            `   Agent URI: ${agentUri}`,
            `   Tx Hash:  ${txHash}`,
            `   Registry: ${registryAddress}`,
          ].join('\n'),
        })
      } catch (err) {
        setState({
          status: 'error',
          message: `Registration failed: ${(err as Error).message}`,
        })
      }
    }

    run()
  }, [chainName, privateKey, broadcast, agentUri])

  return (
    <Box flexDirection="column">
      {state.status === 'idle' && <Text color="gray">Preparing…</Text>}
      {state.status === 'working' && <Text color="cyan">{state.message}</Text>}
      {state.status === 'done' && <Text color="green">{state.message}</Text>}
      {state.status === 'error' && <Text color="red">❌ {state.message}</Text>}
    </Box>
  )
}
