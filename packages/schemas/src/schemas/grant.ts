import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";


export const GRANT_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/grantProgram/1.0.0',
  source: GITHUB_URL,
  name: 'Grant',
  title: 'Grant',
  version: '1.0.0',
  description: 'A grant issued by an organization.',
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
