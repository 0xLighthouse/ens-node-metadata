import { Schema } from "./types";
import { ENSIP5 } from "./utils/ensip5";

export const COMMITTEE_SCHEMA: Schema = {
  github: 'https://github.com/lighthouse-labs/ens-org-registrar',
  version: '1.0.0',
  name: 'Committee',
  description: 'A group of entities that have been empowered by a larger organization to undertake some activity.',
  attributes: [
    ...ENSIP5.attributes,
    ...[
      {
        name: 'name',
        type: 'string',
        key: 'name',
        description: 'Committee name',
        notes: 'Inherited from ENSIP-5',
        isRequired: true,
      },
      {
        name: 'description',
        type: 'string',
        key: 'description',
        description: 'Committee description',
        notes: 'Inherited from ENSIP-5',
        isRequired: true,
      }
    ]
  ],
}
