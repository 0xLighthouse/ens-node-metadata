import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const APPLICATION_SCHEMA: Schema = {
  $id: `${GITHUB_URL}/schemas/application/1.0.0`,
  source: GITHUB_URL,
  title: 'Application',
  version: '1.0.0',
  description: 'An application, service, or dApp within the organization.',
  type: 'object' as const,
  properties: {
    class: {
      type: 'string',
      description: 'The class of the application',
      isRequired: false,
    },
    name: {
      type: 'string',
      description: 'The name of the application',
      isRequired: false,
    },
    description: {
      type: 'string',
      description: 'Description of the application\'s purpose and functionality',
      isRequired: false,
    },
    url: {
      type: 'string',
      description: 'URL where the application is hosted or accessed',
      format: 'uri',
      isRequired: false,
    },
    repository: {
      type: 'string',
      description: 'Source code repository URL',
      isRequired: false,
    },
    version: {
      type: 'string',
      description: 'Current version of the application',
      isRequired: false,
    },
    status: {
      type: 'string',
      description: 'Application status (e.g., Active, Development, Deprecated)',
      isRequired: false,
    },
  },
}
