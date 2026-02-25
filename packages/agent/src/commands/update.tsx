import { readFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'
import React from 'react'
import { http, createPublicClient, createWalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { z } from 'zod'
import { AgentMetadataPayloadSchema } from '../index.js'

export const args = z.tuple([
  z.string().describe('ENS name (e.g. myagent.eth)'),
  z.string().describe('payload.json — flat ENS text-record object'),
])

export const options = z.object({
  privateKey: z.string().describe('Private key for signing (hex, prefixed with 0x)'),
  broadcast: z
    .boolean()
    .default(false)
    .describe('Broadcast the transaction on-chain (default: dry run)'),
})

type Props = {
  args: z.infer<typeof args>
  options: z.infer<typeof options>
}

type State =
  | { status: 'idle' }
  | { status: 'working'; message: string }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string }

/**
 * `agent update` — identical to `agent register` but semantically intended for
 * updating an already-registered agent's ENS text records.
 *
 * Uses viem + ensjs `setRecords` under the hood. Both commands call the same
 * on-chain function; the distinction is conceptual (initial set vs. update).
 */
export default function Update({ args: [ensName, payloadFile], options }: Props) {
  const { exit } = useApp()
  const [state, setState] = React.useState<State>({ status: 'idle' })

  React.useEffect(() => {
    async function run() {
      // 1. Parse and validate payload
      let payload: Record<string, string>
      try {
        const raw: unknown = JSON.parse(readFileSync(payloadFile, 'utf8'))
        const result = AgentMetadataPayloadSchema.safeParse(raw)
        if (!result.success) {
          const issues = result.error.issues
            .map((i) => `[${i.path.join('.') || 'root'}] ${i.message}`)
            .join('\n')
          setState({ status: 'error', message: `Invalid payload:\n${issues}` })
          exit(new Error('validation failed'))
          return
        }
        payload = result.data
      } catch (err) {
        setState({ status: 'error', message: `Error reading payload: ${(err as Error).message}` })
        exit(new Error('read error'))
        return
      }

      const texts = Object.entries(payload).map(([key, value]) => ({ key, value }))

      if (!options.broadcast) {
        // Dry run — print what would be updated
        const lines = [
          `Dry run — would update ${texts.length} text records on ${ensName}:`,
          '',
          ...texts.map((t) => `  setText("${t.key}", "${t.value}")`),
          '',
          'Run with --broadcast to submit on-chain.',
        ]
        setState({ status: 'done', message: lines.join('\n') })
        exit()
        return
      }

      // 2. Broadcast
      setState({
        status: 'working',
        message: `Updating ${texts.length} text records on ${ensName}…`,
      })
      try {
        const { addEnsContracts } = await import('@ensdomains/ensjs')
        const { setRecords } = await import('@ensdomains/ensjs/wallet')
        const { getResolver } = await import('@ensdomains/ensjs/public')

        const account = privateKeyToAccount(options.privateKey as `0x${string}`)
        const chain = addEnsContracts(mainnet)

        const publicClient = createPublicClient({
          chain,
          transport: http(),
        })

        const walletClient = createWalletClient({
          account,
          chain,
          transport: http(),
        })

        const resolverAddress = await getResolver(publicClient, { name: ensName })
        if (!resolverAddress) {
          setState({
            status: 'error',
            message: `No resolver found for ${ensName}. Set a resolver first.`,
          })
          exit(new Error('no resolver'))
          return
        }

        const hash = await setRecords(walletClient, {
          name: ensName,
          texts,
          coins: [],
          resolverAddress,
        })

        setState({ status: 'done', message: `✅ Transaction submitted: ${hash}` })
        exit()
      } catch (err) {
        setState({ status: 'error', message: `Transaction failed: ${(err as Error).message}` })
        exit(new Error('tx failed'))
      }
    }

    run()
  }, [exit, ensName, payloadFile, options])

  return (
    <Box flexDirection="column">
      {state.status === 'idle' && <Text color="gray">Preparing…</Text>}
      {state.status === 'working' && <Text color="cyan">{state.message}</Text>}
      {state.status === 'done' && <Text color="green">{state.message}</Text>}
      {state.status === 'error' && <Text color="red">❌ {state.message}</Text>}
    </Box>
  )
}
