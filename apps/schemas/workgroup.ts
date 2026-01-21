import { Schema } from "./types";
import { GITHUB_URL } from "./config/constants";

export const WORKGROUP_SCHEMA: Schema = {
  github: GITHUB_URL,
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
