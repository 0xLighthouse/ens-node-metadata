import { Schema } from "../types";
import { ENSIP5 } from "./utils/ensip5";
import { GITHUB_URL } from "../config/constants";

export const COMMITTEE_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Committee',
  version: '1.0.0',
  description: 'A group of entities that have been empowered by a larger organization to undertake some activity.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: 'name',
      description: 'Committee name',
      isRequired: true,
    },
    // Override description from ENSIP-5 to make it required and customize the text
    {
      name: 'description',
      type: 'text',
      key: 'description',
      description: 'Committee description',
      isRequired: true,
    },
    // Include all other ENSIP-5 attributes
    ...ENSIP5.attributes.filter(attr => attr.key !== 'description'),
  ],
}
