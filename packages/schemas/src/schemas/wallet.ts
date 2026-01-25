import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const WALLET_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Wallet',
  version: '1.0.0',
  description: 'A wallet for holding or managing assets.',
  attributes: [
    {
      name: 'title',
      type: 'string',
      key: '_.title',
      description: 'Human-readable wallet title',
      isRequired: false,
    },
    {
      name: 'description',
      type: 'string',
      key: '_.description',
      description: 'Human-readable wallet description',
      isRequired: false,
    },
    {
      name: 'chainId',
      type: 'string',
      key: '_.chainId',
      description: 'Chain ID where the wallet is deployed',
      isRequired: false,
    },
  ],
}
