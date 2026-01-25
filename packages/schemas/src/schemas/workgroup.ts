import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";
import { ENSIP5 } from "./utils/ensip5";

export const WORKGROUP_SCHEMA: Schema = {
  source: GITHUB_URL,
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
      name: 'description',
      type: 'text',
      key: 'description',
      description: 'Workgroup description',
      isRequired: true,
    },
    {
      name: 'lead',
      type: 'string',
      key: '_.lead',
      description: 'Workgroup lead',
      isRequired: false,
    },
    // Include other ENSIP-5 attributes
    ...ENSIP5.attributes.filter(attr => attr.key !== 'description'),
  ],
}
