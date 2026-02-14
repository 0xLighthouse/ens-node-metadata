import { Schema } from "../types";

export const AGENT_SCHEMA: Schema = {
  source: 'https://eips.ethereum.org/EIPS/eip-8004',
  name: 'Agent',
  version: '1.0.0',
  description:
    'Trustless agent identity metadata aligned with ERC-8004 registration format.',
  attributes: [
    {
      name: 'agentURI',
      type: 'string',
      key: 'agent-uri',
      description: 'URI to the ERC-8004 registration file',
      isRequired: true,
      notes: 'ipfs://, https://, or data:application/json;base64,...',
    },
    {
      name: 'type',
      type: 'string',
      key: 'type',
      description: 'Registration file type discriminator',
      isRequired: true,
      notes: 'Use: https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    },
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Agent display name',
      isRequired: true,
    },
    {
      name: 'description',
      type: 'string',
      key: 'description',
      description: 'Natural-language description of the agent',
      isRequired: true,
    },
    {
      name: 'image',
      type: 'string',
      key: 'image',
      description: 'Agent image/avatar URI',
      isRequired: true,
    },
    {
      name: 'services',
      type: 'json',
      key: 'services',
      description: 'Advertised service endpoints',
      isRequired: true,
      notes:
        'Array of {name, endpoint, version?}. Supports A2A, MCP, ENS, DID, web, email, etc.',
    },
    {
      name: 'x402Support',
      type: 'boolean',
      key: 'x402-support',
      description: 'Whether x402 payment flow is supported',
      isRequired: true,
    },
    {
      name: 'active',
      type: 'boolean',
      key: 'active',
      description: 'Whether the agent is currently active',
      isRequired: true,
    },
    {
      name: 'registrations',
      type: 'json',
      key: 'registrations',
      description: 'Cross-chain identity registrations',
      isRequired: true,
      notes:
        'Array of {agentRegistry, agentId}; agentRegistry format: {namespace}:{chainId}:{identityRegistry}.',
    },
    {
      name: 'supportedTrust',
      type: 'json',
      key: 'supported-trust',
      description: 'Trust models supported by the agent',
      isRequired: false,
      notes:
        'Examples: reputation, crypto-economic, tee-attestation, zkml-proof.',
    },
    {
      name: 'agentWallet',
      type: 'string',
      key: 'agent-wallet',
      description: 'Verified payout wallet for agent operations',
      isRequired: false,
      notes:
        'Corresponds to reserved on-chain metadata key in ERC-8004 Identity Registry.',
    },
  ],
};
