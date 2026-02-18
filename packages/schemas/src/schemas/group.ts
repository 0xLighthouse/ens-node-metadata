import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../globals/ensip-5";

export const GROUP_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/group/0.1.4`,
  source: GITHUB_URL,
  title: 'Group',
  version: '0.1.4',
  description: 'This node describes a group of individuals or entities with a shared purpose or responsibility.',
  type: 'object' as const,
  properties: {
    class: {
      type: 'string',
      default: 'Group',
      description: 'High-level identifier of this node type',
      examples: ['Group', 'Committee', 'Council', 'Workgroup', 'Team'],
    },
    name: {
      type: 'string',
      description: 'The name of the group',
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
      description: 'URL of the group',
    },
    lead: {
      type: 'string',
      description: 'ENS name or address of the group leader',
    },
    'lead-title': {
      type: 'string',
      description: 'Title or role of the group leader',
      examples: ['Lead Steward', 'Chair', 'Manager', 'Owner'],
    },
    'members-title': {
      type: 'string',
      description: 'Title or role of the group members',
      examples: ['Member', 'Steward', 'Contributor', 'Participant'],
    },
  },
  required: ['class'],
  recommended: ['name', 'lead', 'avatar', 'url', 'description']
}
