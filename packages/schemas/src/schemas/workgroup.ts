import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";

export const WORKGROUP_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/workgroup/1.0.0`,
  source: GITHUB_URL,
  title: 'Workgroup',
  version: '1.0.0',
  description: 'An operational team focused on executing a specific set of tasks or a domain of work on behalf of the organization.',
  type: 'object' as const,
  properties: {
    'name': {
      type: 'string',
      description: 'Workgroup name',
      isRequired: false,
    },
    'lead': {
      type: 'string',
      description: 'Workgroup lead',
      isRequired: false,
    },
    ...ENSIP5.properties,
  }
}
