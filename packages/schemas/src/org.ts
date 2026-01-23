import { Schema } from "./types";
import { GITHUB_URL } from "./config/constants";

export const ORGANIZATION_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Organizational Unit',
  version: '1.0.0',
  description: 'The base template for an organization. Can be used to group together other entities to represent departments, committees, groups, or even entire organizations.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'The name of the organizational unit',
      isRequired: true,
    },
    {
      name: 'description',
      type: 'string',
      key: '_.description',
      description: 'The description of the organizational unit',
      isRequired: true,
    },
    {
      name: 'website',
      type: 'string',
      key: '_.website',
      description: 'Primary website URL',
      isRequired: false,
    },
    {
      name: 'email',
      type: 'string',
      key: '_.email',
      description: 'Primary contact email',
      isRequired: false,
    },
  ],
}
