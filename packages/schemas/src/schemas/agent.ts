import type { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const AGENT_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/agent/1.0.0`,
  source: 'https://eips.ethereum.org/EIPS/eip-8004',
  title: 'Agent',
  version: '1.0.0',
  description: 'AI agent identity metadata aligned with ERC-8004 registration format.',
  type: 'object' as const,
  properties: {
    schema: {
      type: 'string',
      format: 'uri',
      description: 'IPFS URI to the published schema version used by this node'
    },
    class: {
      type: 'string',
      default: 'Agent',
      description: 'High-level identifier of this node type'
    },
    'agent-uri': {
      type: 'string',
      format: 'uri',
      description: 'URI to the ERC-8004 registration file',
    },
    type: {
      type: 'string',
      description: 'Registration file type discriminator',
    },
    name: {
      type: 'string',
      description: 'Agent display name',
    },
    description: {
      type: 'string',
      description: 'Natural-language description of the agent',
    },
    services: {
      type: 'string',
      description: 'Advertised service endpoints',
    },
    'x402-support': {
      type: 'boolean',
      description: 'Whether x402 payment flow is supported',

    },
    active: {
      type: 'string',
      format: 'boolean',
      description: 'Whether the agent is currently active',
    },
    registrations: {
      type: 'string',
      description: 'Cross-chain identity registrations',
    },
    'supported-trust': {
      type: 'string',
      description: 'Trust models supported by the agent',
    },
    'agent-wallet': {
      type: 'string',
      description: 'Verified payout wallet for agent operations',
    },
  },
  patternProperties: {
    '^service(\[[^\]]+\])?$': {
      type: 'string',
      description: 'service[name] => endpoint, per ERC-8004 eg. service[MCP] => <ENDPOINT_URL>',
    }
  },
  required: ['class'],
  recommended: ['agent-uri']
};
