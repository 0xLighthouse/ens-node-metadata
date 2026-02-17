import { Schema } from "../types";
import { ENSIP5 } from "../utils/ensip5";
import { GITHUB_URL } from "../config/constants";

export const COUNCIL_SCHEMA: Schema = {
  $id: GITHUB_URL + '/schemas/council/1.0.0',
  source: GITHUB_URL,
  name: 'Council',
  title: 'Council',
  version: '1.0.0',
  description: 'A high-level governance body with a broad, strategic mandate.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the council',
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
      description: 'The name of the council',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
