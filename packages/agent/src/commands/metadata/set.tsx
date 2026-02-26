import { readFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'
import React from 'react'
import { z } from 'zod'
import { SCHEMA_MAP } from '@ens-node-metadata/schemas'
import { validateMetadataSchema } from '@ens-node-metadata/sdk'
import { setEnsTextRecords } from '../../lib/ens-write.js'

export const description = 'Set ENS metadata text records from a payload file'

export const args = z.tuple([
  z.string().describe('ENS name (e.g. myagent.eth)'),
  z.string().describe('payload.json'),
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

export default function Set({ args: [ensName, payloadFile], options }: Props) {
  const { exit } = useApp()
  const [state, setState] = React.useState<State>({ status: 'idle' })

  React.useEffect(() => {
    async function run() {
      let payload: Record<string, string>
      try {
        const raw: unknown = JSON.parse(readFileSync(payloadFile, 'utf8'))
        const result = validateMetadataSchema(raw, SCHEMA_MAP.Agent)
        if (!result.success) {
          const issues = result.errors.map((e) => `[${e.key}] ${e.message}`).join('\n')
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
        const lines = [
          `Dry run — would set ${texts.length} text records on ${ensName}:`,
          '',
          ...texts.map((t) => `  setText("${t.key}", "${t.value}")`),
          '',
          'Run with --broadcast to submit on-chain.',
        ]
        setState({ status: 'done', message: lines.join('\n') })
        exit()
        return
      }

      setState({ status: 'working', message: `Setting ${texts.length} text records on ${ensName}…` })
      try {
        const hash = await setEnsTextRecords(ensName, texts, options.privateKey)
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
