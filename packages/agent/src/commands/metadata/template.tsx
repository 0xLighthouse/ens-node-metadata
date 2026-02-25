import { Text, useApp } from 'ink'
import React from 'react'

/**
 * Starter ENS metadata payload for an agent.
 * All values are placeholders — fill in before calling `agent register`.
 *
 * Keys map directly to ENS text records. The pattern `service[PROTOCOL]`
 * follows ERC-8004 recommendations.
 */
const TEMPLATE: Record<string, string> = {
  class: 'Agent',
  'agent-uri': 'ipfs://<CID-OF-YOUR-REGISTRATION-FILE>',
  name: 'My Agent',
  description: 'A brief description of what this agent does.',
  active: 'true',
  'x402-support': 'false',
  'supported-trust': 'none',
  'agent-wallet': '0x<AGENT-HOT-WALLET-ADDRESS>',
  'service[MCP]': 'https://example.com/mcp',
}

export default function MetadataTemplate() {
  const { exit } = useApp()

  React.useEffect(() => {
    exit()
  }, [exit])

  return <Text>{JSON.stringify(TEMPLATE, null, 2)}</Text>
}
