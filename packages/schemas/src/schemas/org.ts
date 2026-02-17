import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";

export const ORGANIZATION_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/org/0.1.4',
  source: GITHUB_URL,
  name: 'Organizational Unit',
  title: 'Organizational Unit',
  version: '0.1.5',
  description: 'The base template for an organization. Can be used to group together other entities to represent departments, committees, groups, or even entire organizations.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the organizational unit',
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
      description: 'The name of the organizational unit',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
