import { Box, Text, useApp } from 'ink'
import React from 'react'
import { http, createPublicClient, createWalletClient, verifyTypedData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { z } from 'zod'
import IdentityRegistryABI from '../../../lib/abis/IdentityRegistry.json' with { type: 'json' }
import { SUPPORTED_CHAINS, resolveChain } from '../../../lib/registry.js'

export const description = 'Link a verified wallet to an agent via EIP-712 signature'

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
  deadline: z
    .string()
    .optional()
    .describe('Deadline unix timestamp (auto-generated if omitted)'),
  signature: z
    .string()
    .optional()
    .describe('EIP-712 signature from the wallet (auto-signed if omitted)'),
})

export const args = z.tuple([
  z.string().describe('agent-id (token ID)'),
  z.string().describe('wallet-address (0x...)'),
])

type Props = {
  options: z.infer<typeof options>
  args: z.infer<typeof args>
}

type State =
  | { status: 'idle' }
  | { status: 'working'; message: string }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string }

const EIP712_TYPES = {
  AgentWalletSet: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'owner', type: 'address' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

export default function SetWallet({
  options: { chainName, privateKey, broadcast, deadline: deadlineOpt, signature: signatureOpt },
  args: [agentId, walletAddress],
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
      const publicClient = createPublicClient({ chain, transport: http() })
      const tokenId = BigInt(agentId)
      const chainId = await publicClient.getChainId()

      const domain = {
        name: 'ERC8004IdentityRegistry',
        version: '1',
        chainId,
        verifyingContract: registryAddress,
      } as const

      let finalDeadline: bigint
      let finalSignature: `0x${string}`

      if (signatureOpt && deadlineOpt) {
        // Verify provided signature recovers to the wallet address
        finalDeadline = BigInt(deadlineOpt)
        finalSignature = signatureOpt as `0x${string}`

        const valid = await verifyTypedData({
          address: walletAddress as `0x${string}`,
          domain,
          types: EIP712_TYPES,
          primaryType: 'AgentWalletSet',
          message: {
            agentId: tokenId,
            newWallet: walletAddress as `0x${string}`,
            owner: account.address,
            deadline: finalDeadline,
          },
          signature: finalSignature,
        })

        if (!valid) {
          setState({
            status: 'error',
            message: `Signature does not recover to wallet ${walletAddress}`,
          })
          return
        }
      } else {
        // Auto-sign: assumes private key controls the wallet being linked
        const block = await publicClient.getBlock()
        finalDeadline = block.timestamp + 240n

        const walletClient = createWalletClient({ account, chain, transport: http() })
        finalSignature = await walletClient.signTypedData({
          account,
          domain,
          types: EIP712_TYPES,
          primaryType: 'AgentWalletSet',
          message: {
            agentId: tokenId,
            newWallet: walletAddress as `0x${string}`,
            owner: account.address,
            deadline: finalDeadline,
          },
        })
      }

      if (!broadcast) {
        const lines = [
          `Dry run — would call setAgentWallet on ${chainName}:`,
          '',
          `  Registry:  ${registryAddress}`,
          `  Agent ID:  ${tokenId.toString()}`,
          `  Wallet:    ${walletAddress}`,
          `  Deadline:  ${finalDeadline.toString()}`,
          `  Signer:    ${account.address}`,
          `  Signature: ${signatureOpt ? 'provided (verified)' : 'auto-signed'}`,
        ]

        if (!signatureOpt) {
          lines.push(
            '',
            'If the wallet is controlled by a different key, have them sign:',
            '',
            '  EIP-712 Domain:',
            `    name:              ERC8004IdentityRegistry`,
            `    version:           1`,
            `    chainId:           ${chainId}`,
            `    verifyingContract: ${registryAddress}`,
            '',
            '  Primary Type: AgentWalletSet',
            '  Message:',
            `    agentId:   ${tokenId.toString()}`,
            `    newWallet: <wallet-address>`,
            `    owner:     ${account.address}`,
            `    deadline:  <unix-timestamp>`,
            '',
            'Then pass --signature <0x...> --deadline <timestamp>',
          )
        }

        lines.push('', 'Run with --broadcast to submit on-chain.')

        setState({ status: 'done', message: lines.join('\n') })
        return
      }

      setState({ status: 'working', message: `Linking wallet on ${chainName}…` })

      try {
        const walletClient = createWalletClient({ account, chain, transport: http() })

        const { request } = await publicClient.simulateContract({
          account,
          address: registryAddress,
          abi: IdentityRegistryABI,
          functionName: 'setAgentWallet',
          args: [tokenId, walletAddress as `0x${string}`, finalDeadline, finalSignature],
        })

        const txHash = await walletClient.writeContract(request)

        setState({
          status: 'done',
          message: [
            `✅ Wallet linked on ${chainName}`,
            `   Agent ID: ${tokenId.toString()}`,
            `   Wallet:   ${walletAddress}`,
            `   Tx Hash:  ${txHash}`,
          ].join('\n'),
        })
      } catch (err) {
        setState({
          status: 'error',
          message: `setAgentWallet failed: ${(err as Error).message}`,
        })
      }
    }

    run()
  }, [chainName, privateKey, broadcast, agentId, walletAddress, deadlineOpt, signatureOpt])

  return (
    <Box flexDirection="column">
      {state.status === 'idle' && <Text color="gray">Preparing…</Text>}
      {state.status === 'working' && <Text color="cyan">{state.message}</Text>}
      {state.status === 'done' && <Text color="green">{state.message}</Text>}
      {state.status === 'error' && <Text color="red">❌ {state.message}</Text>}
    </Box>
  )
}
