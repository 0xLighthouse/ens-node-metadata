import { Schema } from "./types"
import { GITHUB_URL } from "./config/constants"

/**
 * TODO: Look at what enscribe is doing.
 */
export const CONTRACT_SCHEMA: Schema = {
  github: GITHUB_URL,
  name: 'Contract',
  version: '1.0.0',
  description: 'A smart contract.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'Human-readable contract name',
      isRequired: true,
    },
    {
      name: 'id',
      type: 'string',
      key: '_.id',
      description: 'Unique ID for the contract',
      isRequired: false,
    },
    {
      name: 'chainId',
      type: 'string',
      key: '_.chainId',
      description: 'Chain ID where the contract is deployed',
      isRequired: false,
    },
  ],
}
