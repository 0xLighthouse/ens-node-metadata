import { Schema } from "./types";
import { GITHUB_URL } from "./config/constants";

export const LOCATION_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Location',
  version: '1.0.0',
  description: 'A physical location in the real world which houses an office.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'Location name',
      isRequired: true,
    },
    {
      name: 'address',
      type: 'string',
      key: '_.address',
      description: 'Street address',
      isRequired: true,
    },
    {
      name: 'timezone',
      type: 'string',
      key: '_.timezone',
      description: 'Timezone identifier',
      isRequired: false,
    },
  ],
}
