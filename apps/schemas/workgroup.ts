import { Schema } from "./types";

export const WORKGROUP_SCHEMA: Schema = {
  name: 'Workgroup',
  version: '1.0.0',
  description: 'A working group.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'Workgroup name',
      isRequired: true,
    },
    {
      name: 'focus',
      type: 'string',
      key: '_.focus',
      description: 'Primary focus area',
      isRequired: false,
    },
    {
      name: 'lead',
      type: 'string',
      key: '_.lead',
      description: 'Workgroup lead',
      isRequired: false,
    },
  ],
}
