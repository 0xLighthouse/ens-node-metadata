import type { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const WALLET_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/wallet/1.0.0`,
  source: GITHUB_URL,
  title: 'Wallet',
  version: '1.0.0',
  description: 'A wallet for holding or managing assets.',
  type: 'object' as const,
  properties: {
    class: {
      type: 'string',
      default: 'Wallet',
      description: 'High-level identifier of this node type',
      examples: ['Wallet', 'Account'],
    },
    description: {
      type: 'string',
      description: 'Indicates the purpose of the wallet',
    },
  },
  required: ['class'],
  recommended: ['description']
}
