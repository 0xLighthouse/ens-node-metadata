import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const OFFICE_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Office',
  version: '1.0.0',
  description: 'A workplace (virtual or in the real world) that acts as a coordination point offering some type of service.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'Office name',
      isRequired: true,
    },
    {
      name: 'location',
      type: 'string',
      key: '_.location',
      description: 'Physical or virtual location',
      isRequired: false,
    },
    {
      name: 'hours',
      type: 'string',
      key: '_.hours',
      description: 'Primary operating hours',
      isRequired: false,
    },
  ],
}
