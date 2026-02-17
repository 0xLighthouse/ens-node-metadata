import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";


export const GRANT_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/grantProgram/1.0.0`,
  source: GITHUB_URL,
  title: 'Grant',
  version: '1.0.0',
  description: 'A grant issued by an organization.',
  type: 'object' as const,
  properties: {
    'name': {
      type: 'string',
      description: 'The name of the grant program',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
