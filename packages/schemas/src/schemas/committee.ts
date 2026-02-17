import { Schema } from "../types";
import { ENSIP5 } from "../utils/ensip-5";
import { GITHUB_URL } from "../config/constants";

export const COMMITTEE_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/committee/1.0.0`,
  source: GITHUB_URL,
  title: 'Committee',
  version: '1.0.0',
  description: 'A formal group with delegated decision‑making power over a particular function of the organization.',
  type: 'object' as const,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the committee',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
