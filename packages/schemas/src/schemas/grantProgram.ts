import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";


export const DELEGATE_SCHEMA: Schema = {
  $id: 'https://github.com/0xLighthouse/ens-node-metadata/schemas/grantProgram/1.0.0',
  source: GITHUB_URL,
  name: 'GrantProgram',
  title: 'GrantProgram',
  version: '1.0.0',
  description: 'A grant program.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the grant program',
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
      description: 'The name of the grant program',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
