import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip-5";


export const DELEGATE_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/delegate/1.0.0`,
  source: GITHUB_URL,
  title: 'Delegate',
  version: '1.0.0',
  description: 'A delegate.',
  type: 'object' as const,
  properties: {
    'full-name': {
      type: 'string',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    statement: {
      type: 'string',
      description: 'Generic delegate statement ',
      isRequired: false,
    },
    conflictOfInterest: {
      type: 'string',
      description: 'Generic conflict of interest declaration ',
      isRequired: false,
    },
    forumHandle: {
      type: 'string',
      description: 'Default forum handle',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
  patternProperties: {
    '^statement(\\[[^\\]]+\\])?$': {
      type: 'string',
      description: 'Delegate statement per organization (e.g. statement[dao.eth])',
      isRequired: false,
    },
    '^conflict-of-interest(\\[[^\\]]+\\])?$': {
      type: 'string',
      description: 'Conflict of interest declaration per organization (e.g. conflict-of-interest[dao.eth])',
      isRequired: false,
    },
    '^forum-handle(\\[[^\\]]+\\])?$': {
      type: 'string',
      description: 'Forum handle per organization (e.g. forum-handle[dao.eth])',
      isRequired: false,
    },
  },
}
