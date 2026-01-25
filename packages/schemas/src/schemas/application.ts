import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const APPLICATION_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Application',
  version: '1.0.0',
  description: 'An application, service, or dApp within the organization.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'The name of the application',
      isRequired: true,
    },
    {
      name: 'description',
      type: 'string',
      key: '_.description',
      description: 'Description of the application purpose and functionality',
      isRequired: false,
    },
    {
      name: 'url',
      type: 'string',
      key: '_.url',
      description: 'URL where the application is hosted or accessed',
      isRequired: false,
    },
    {
      name: 'repository',
      type: 'string',
      key: '_.repository',
      description: 'Source code repository URL',
      isRequired: false,
    },
    {
      name: 'version',
      type: 'string',
      key: '_.version',
      description: 'Current version of the application',
      isRequired: false,
    },
    {
      name: 'status',
      type: 'string',
      key: '_.status',
      description: 'Application status (e.g., Active, Development, Deprecated)',
      isRequired: false,
    },
  ],
}
