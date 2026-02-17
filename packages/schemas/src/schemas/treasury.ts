import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";

export const TREASURY_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/treasury/1.0.0`,
  source: GITHUB_URL,
  title: 'Treasury',
  version: '1.0.0',
  description: 'A treasury for managing organizational funds and assets.',
  type: 'object' as const,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the treasury',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
