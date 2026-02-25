import { readFileSync } from 'node:fs'
import { Box, Text, useApp } from 'ink'
import React from 'react'
import { z } from 'zod'
import { validateRegistrationFile } from '../index.js'

export const args = z.tuple([z.string().describe('file')])

type Props = {
  args: z.infer<typeof args>
}

export default function Validate({ args: [file] }: Props) {
  const { exit } = useApp()

  let fileError: string | null = null
  let result: ReturnType<typeof validateRegistrationFile> | null = null

  try {
    const contents = readFileSync(file, 'utf8')
    const raw: unknown = JSON.parse(contents)
    result = validateRegistrationFile(raw)
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
      <Box>
        <Text color="green">✅ Valid AgentRegistrationFile</Text>
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
