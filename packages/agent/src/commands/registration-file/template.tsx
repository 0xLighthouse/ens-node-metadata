import { Text, useApp } from 'ink'
import React from 'react'

const TEMPLATE = {
  type: 'Agent',
  name: '',
  description: '',
  image: '',
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
}

export default function RegistrationFileTemplate() {
  const { exit } = useApp()

  React.useEffect(() => {
    exit()
  }, [exit])

  return <Text>{JSON.stringify(TEMPLATE, null, 2)}</Text>
}
