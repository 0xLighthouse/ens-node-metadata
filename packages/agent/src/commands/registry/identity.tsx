import { Box, Text, useApp } from 'ink'
import React from 'react'
import { http, createPublicClient } from 'viem'
import { base, mainnet } from 'viem/chains'
import { z } from 'zod'

export const options = z.object({
  chainName: z
    .enum(['base', 'mainnet'])
    .default('mainnet')
    .describe('Chain to query (base | mainnet)'),
})

export const args = z.tuple([z.string().describe('agent-uri')])

type Props = {
  options: z.infer<typeof options>
  args: z.infer<typeof args>
}

/**
 * Known ERC-8004 Identity Registry contract addresses.
 * Override via ERC8004_REGISTRY_BASE / ERC8004_REGISTRY_MAINNET env vars.
 */
const REGISTRY_ADDRESSES: Record<string, `0x${string}`> = {
  mainnet: (process.env.ERC8004_REGISTRY_MAINNET ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
  base: (process.env.ERC8004_REGISTRY_BASE ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
}

const ERC8004_REGISTRY_ABI = [
  {
    name: 'agentOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agentUri', type: 'string' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'agentUri', type: 'string' },
    ],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

type IdentityResult = {
  owner: string
  tokenId: bigint
  agentUri: string
  chain: string
  registryAddress: string
}

type State =
  | { status: 'loading' }
  | { status: 'done'; identity: IdentityResult }
  | { status: 'error'; message: string }

export default function RegistryIdentity({ options: { chainName }, args: [agentUri] }: Props) {
  const { exit } = useApp()
  const [state, setState] = React.useState<State>({ status: 'loading' })

  React.useEffect(() => {
    async function run() {
      const chain = chainName === 'base' ? base : mainnet
      const registryAddress = REGISTRY_ADDRESSES[chainName]

      if (registryAddress === '0x0000000000000000000000000000000000000000') {
        setState({
          status: 'error',
          message:
            `No registry address configured for ${chainName}.\n` +
            `Set ERC8004_REGISTRY_${chainName.toUpperCase()} env var to the contract address.`,
        })
        exit(new Error('no registry address'))
        return
      }

      try {
        const client = createPublicClient({
          chain,
          transport: http(),
        })

        const result = await client.readContract({
          address: registryAddress,
          abi: ERC8004_REGISTRY_ABI,
          functionName: 'agentOf',
          args: [agentUri],
        })

        setState({
          status: 'done',
          identity: {
            owner: result[0],
            tokenId: result[1],
            agentUri: result[2],
            chain: chainName,
            registryAddress,
          },
        })
        exit()
      } catch (err) {
        setState({
          status: 'error',
          message: `Registry read failed: ${(err as Error).message}`,
        })
        exit(new Error('registry read failed'))
      }
    }

    run()
  }, [exit, chainName, agentUri])

  return (
    <Box flexDirection="column">
      {state.status === 'loading' && <Text color="cyan">Querying ERC-8004 registry…</Text>}
      {state.status === 'done' && (
        <Box flexDirection="column">
          <Text color="green">✅ Agent Identity ({state.identity.chain})</Text>
          <Text> Agent URI: {state.identity.agentUri}</Text>
          <Text> Owner: {state.identity.owner}</Text>
          <Text> Token ID: {state.identity.tokenId.toString()}</Text>
          <Text> Registry: {state.identity.registryAddress}</Text>
        </Box>
      )}
      {state.status === 'error' && <Text color="red">❌ {state.message}</Text>}
    </Box>
  )
}
