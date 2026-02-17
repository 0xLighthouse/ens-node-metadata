import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";


export const PERSON_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/person/1.0.0`,
  source: GITHUB_URL,
  title: 'Person',
  version: '1.0.0',
  description: 'A person.',
  type: 'object' as const,
  properties: {
    'full-name': {
      type: 'string',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    'title': {
      type: 'string',
      description: 'Title within the organization, if any',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
