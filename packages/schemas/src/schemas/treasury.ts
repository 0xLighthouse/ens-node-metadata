import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";

export const TREASURY_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/treasury/1.0.0',
  source: GITHUB_URL,
  name: 'Treasury',
  title: 'Treasury',
  version: '1.0.0',
  description: 'A treasury for managing organizational funds and assets.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the treasury',
      isRequired: false,
    },
    ...ENSIP5.attributes,
  ],
  type: 'object' as const,
  properties: {
    name: {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the treasury',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
