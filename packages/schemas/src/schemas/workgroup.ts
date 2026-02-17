import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";

export const WORKGROUP_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/workgroup/1.0.0',
  source: GITHUB_URL,
  name: 'Workgroup',
  title: 'Workgroup',
  version: '1.0.0',
  description: 'An operational team focused on executing a specific set of tasks or a domain of work on behalf of the organization.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Workgroup name',
      isRequired: false,
    },
    {
      name: 'lead',
      type: 'string',
      key: 'lead',
      description: 'Workgroup lead',
      isRequired: false,
    },
    // Include other ENSIP-5 attributes
    ...ENSIP5.attributes,
  ],
  type: 'object' as const,
  properties: {
    'name': {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Workgroup name',
      isRequired: false,
    },
    'lead': {
      name: 'lead',
      type: 'string',
      key: 'lead',
      description: 'Workgroup lead',
      isRequired: false,
    },
    ...ENSIP5.properties,
  }
}
