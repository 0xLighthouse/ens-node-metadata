import { Text, useApp } from 'ink'
import React from 'react'
import { buildRegistrationFile } from '../index.js'

export default function Build() {
  const { exit } = useApp()

  const template = buildRegistrationFile({
    name: 'My Agent',
    description: 'A brief description of what this agent does.',
    services: [
      {
        name: 'MCP',
        endpoint: 'https://example.com/mcp',
        version: '1.0',
      },
    ],
    x402Support: false,
    active: true,
    registrations: [],
    supportedTrust: ['none'],
  })

  React.useEffect(() => {
    exit()
  }, [exit])

  return <Text>{JSON.stringify(template, null, 2)}</Text>
}
