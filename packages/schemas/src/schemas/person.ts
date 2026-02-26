import type { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../globals/ensip-5";


export const PERSON_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/person/1.0.0`,
  source: GITHUB_URL,
  title: 'Person',
  version: '1.0.0',
  description: 'A person.',
  type: 'object' as const,
  properties: {
    class: {
      type: 'string',
      default: 'Person',
      description: 'High-level identifier of this node type',
      examples: ['Person', 'Human', 'Signer', 'Officer', 'Employee', 'Secretary'],
    },
    'full-name': {
      type: 'string',
      description: 'Full legal or preferred name',
    },
    'title': {
      type: 'string',
      description: 'Title within the organization, if any',
    },
  },
}
