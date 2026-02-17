import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "../utils/ensip5";


export const DELEGATE_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/delegate/1.0.0`,
  source: GITHUB_URL,
  name: 'Delegate',
  title: 'Delegate',
  version: '1.0.0',
  description: 'A delegate.',
  attributes: [
    {
      name: 'fullName',
      type: 'string',
      key: 'full-name',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    {
      name: 'statement',
      type: 'string',
      key: 'statement',
      description: 'Delegate statement',
      isRequired: false,
    },
    {
      name: 'conflictOfInterest',
      type: 'string',
      key: 'conflict-of-interest',
      description: 'Conflict of interest declaration',
      isRequired: false,
    },
    {
      name: 'forumHandle',
      type: 'string',
      key: 'forum-handle',
      description: 'Forum handle',
      isRequired: false,
    },
    ...ENSIP5.attributes,
  ],
  type: 'object' as const,
  properties: {
    'full-name': {
      name: 'fullName',
      type: 'string',
      key: 'full-name',
      description: 'Full legal or preferred name',
      isRequired: false,
    },
    statement: {
      name: 'statement',
      type: 'string',
      key: 'statement[]',
      description: 'Generic delegate statement ',
      isRequired: false,
    },
    conflictOfInterest: {
      name: 'conflictOfInterest',
      type: 'string',
      key: 'conflict-of-interest[]',
      description: 'Generic conflict of interest declaration ',
      isRequired: false,
    },
    forumHandle: {
      name: 'forumHandle',
      type: 'string',
      key: 'forum-handle',
      description: 'Default forum handle',
      isRequired: false,
    },
    ...ENSIP5.properties,
  },
  patternProperties: {
    '^statement(\\[[^\\]]+\\])?$': {
      name: 'statement',
      key: 'statement',
      type: 'string',
      description: 'Delegate statement per organization (e.g. statement[dao.eth])',
      isRequired: false,
    },
    '^conflict-of-interest(\\[[^\\]]+\\])?$': {
      name: 'conflictOfInterest',
      key: 'conflict-of-interest',
      type: 'string',
      description: 'Conflict of interest declaration per organization (e.g. conflict-of-interest[dao.eth])',
      isRequired: false,
    },
    '^forum-handle(\\[[^\\]]+\\])?$': {
      name: 'forumHandle',
      key: 'forum-handle',
      type: 'string',
      description: 'Forum handle per organization (e.g. forum-handle[dao.eth])',
      isRequired: false,
    },
  },
}
