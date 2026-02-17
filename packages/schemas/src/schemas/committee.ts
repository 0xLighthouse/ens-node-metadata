import { Schema } from "../types";
import { ENSIP5 } from "../utils/ensip5";
import { GITHUB_URL } from "../config/constants";

export const COMMITTEE_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/committee/1.0.0',
  source: GITHUB_URL,
  name: 'Committee',
  title: 'Committee',
  version: '1.0.0',
  description: 'A formal group with delegated decision‑making power over a particular function of the organization.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the committee',
      isRequired: false,
    },
    // Include all other ENSIP-5 attributes
    ...ENSIP5.attributes,
  ],
  type: 'object' as const,
  properties: {
    name: {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the committee',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
