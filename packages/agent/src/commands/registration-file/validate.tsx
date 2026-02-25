import { readFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'
import React from 'react'
import { z } from 'zod'
import { validateRegistrationFile } from '../../index.js'

export const args = z.tuple([z.string().describe('registration-file.json')])

type Props = {
  args: z.infer<typeof args>
}

export default function RegistrationFileValidate({ args: [file] }: Props) {
  const { exit } = useApp()

  let fileError: string | null = null
  let result: ReturnType<typeof validateRegistrationFile> | null = null
  let legacyWarning = false

  try {
    const contents = readFileSync(file, 'utf8')
    const raw: unknown = JSON.parse(contents)
    result = validateRegistrationFile(raw)
    if (result.success && result.data._legacyEndpoints) {
      legacyWarning = true
    }
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
    return (
      <Box flexDirection="column">
        <Text color="green">✅ Valid ERC-8004 v2.0 AgentRegistrationFile</Text>
        {legacyWarning && (
          <Text color="yellow">
            ⚠️ WA031: Field `endpoints` is deprecated — migrate to `services` (EIP-8004 Jan 2026+)
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text color="red">❌ Invalid AgentRegistrationFile</Text>
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
