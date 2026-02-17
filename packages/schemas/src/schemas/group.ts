import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";

export const GROUP_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/group/0.1.4`,
  source: GITHUB_URL,
  name: 'Group',
  title: 'Group',
  version: '0.1.4',
  description: 'This node represents a logical grouping of multiple child nodes.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'The name of the group',
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
      description: 'The name of the group',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
