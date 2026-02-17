import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";

export const ORGANIZATION_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/org/0.1.5`,
  source: GITHUB_URL,
  title: 'Organization',
  version: '0.1.5',
  description: 'A legal or organizational entity.',
  type: 'object' as const,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the organization',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
