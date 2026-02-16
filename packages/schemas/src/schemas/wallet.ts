import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";

export const WALLET_SCHEMA: Schema = {
  $id: 'https://github.com/0xLighthouse/ens-node-metadata/schemas/wallet/1.0.0',
  source: GITHUB_URL,
  name: 'Wallet',
  title: 'Wallet',
  version: '1.0.0',
  description: 'A wallet for holding or managing assets.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Human-readable wallet name',
      isRequired: false,
    },
    ...ENSIP5.attributes,
  ],
  type: 'object' as const,
  properties: {
    'name': {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Human-readable wallet name',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
