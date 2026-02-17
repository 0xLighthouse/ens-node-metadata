import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";

export const WALLET_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/wallet/1.0.0`,
  source: GITHUB_URL,
  title: 'Wallet',
  version: '1.0.0',
  description: 'A wallet for holding or managing assets.',
  type: 'object' as const,
  properties: {
    'name': {
      type: 'string',
      description: 'Human-readable wallet name',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
