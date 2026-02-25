import { readFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'
import React from 'react'
import { z } from 'zod'
import { AgentMetadataPayloadSchema } from '../../index.js'

export const args = z.tuple([z.string().describe('payload.json')])

type Props = {
  args: z.infer<typeof args>
}

export default function MetadataValidate({ args: [file] }: Props) {
  const { exit } = useApp()

  let fileError: string | null = null
  let result: z.SafeParseReturnType<unknown, Record<string, string>> | null = null

  try {
    const contents = readFileSync(file, 'utf8')
    const raw: unknown = JSON.parse(contents)
    result = AgentMetadataPayloadSchema.safeParse(raw)
  } catch (err) {
    fileError = (err as Error).message
  }

  React.useEffect(() => {
    if (fileError || (result && !result.success)) {
      exit(new Error('validation failed'))
    } else {
      exit()
    }
  }, [exit, fileError, result])

  if (fileError) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error reading file: {fileError}</Text>
      </Box>
    )
  }

  if (result!.success) {
    const keys = Object.keys(result.data)
    return (
      <Box flexDirection="column">
        <Text color="green">✅ Valid ENS agent metadata payload</Text>
        <Text color="gray">  {keys.length} text records</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text color="red">❌ Invalid agent metadata payload</Text>
      {result!.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
        const key = `${path}.${issue.message}`
        return (
          <Box key={key}>
            <Text color="red">
              {'  '}[{path}] {issue.message}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
