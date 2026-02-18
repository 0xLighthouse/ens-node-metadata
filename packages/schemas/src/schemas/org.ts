import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../globals/ensip-5";

export const ORGANIZATION_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/org/0.1.5`,
  source: GITHUB_URL,
  title: 'Organization',
  version: '0.1.8',
  description: 'A legal or organizational entity.',
  type: 'object' as const,
  properties: {
    class: {
      type: 'string',
      default: 'Organization',
      description: 'High-level identifier of this node type',
      examples: ['Organization', 'Foundation', 'OPCo'],
    },
    name: {
      type: 'string',
      description: 'The name of this business unit',
    },
    avatar: {
      type: 'string',
      description: 'A URL to an image used as an avatar or logo',
    },
    description: {
      type: 'string',
      description: 'A description of the name',
    },
    url: {
      type: 'string',
      format: 'uri',
      description: 'URL of the organization',
    },
  },
  required: ['class'],
  recommended: ['name', 'avatar', 'description', 'url']
}
