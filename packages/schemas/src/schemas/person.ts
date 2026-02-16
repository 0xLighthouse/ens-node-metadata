import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";


export const PERSON_SCHEMA: Schema = {
  $id: 'https://github.com/0xLighthouse/ens-node-metadata/schemas/person/1.0.0',
  source: GITHUB_URL,
  name: 'Person',
  title: 'Person',
  version: '1.0.0',
  description: 'A person.',
  attributes: [
    {
      name: 'fullName',
      type: 'string',
      key: 'full-name',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    {
      name: 'title',
      type: 'string',
      key: 'title',
      description: 'Title within the organization, if any',
      isRequired: false,
    },
    ...ENSIP5.attributes, 
  ],
  type: 'object' as const,
  properties: {
    'full-name': {
      name: 'fullName',
      type: 'string',
      key: 'full-name',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    'title': {
      name: 'title',
      type: 'string',
      key: 'title',
      description: 'Title within the organization, if any',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
