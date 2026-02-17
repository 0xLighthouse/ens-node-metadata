import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";

export const GROUP_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/group/0.1.4`,
  source: GITHUB_URL,
  title: 'Group',
  version: '0.1.4',
  description: 'This node represents a logical grouping of multiple child nodes.',
  type: 'object' as const,
  properties: {
    name: {
      type: 'string',
      description: 'The name of the group',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
}
