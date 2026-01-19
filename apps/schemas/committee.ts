import { Schema } from "./types";

export const COMMITTEE_SCHEMA: Schema = {
  name: 'Committee',
  version: '1.0.0',
  description: 'A group of entities that have been empowered by a larger organization to undertake some activity.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'Committee name',
      isRequired: true,
    },
    {
      name: 'charter',
      type: 'string',
      key: '_.charter',
      description: 'Charter or mandate',
      isRequired: false,
    },
    {
      name: 'chair',
      type: 'string',
      key: '_.chair',
      description: 'Current chair or lead',
      isRequired: false,
    },
  ],
}
