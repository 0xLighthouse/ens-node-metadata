import { Schema } from "./types";

export const PERSON_SCHEMA: Schema = {
  name: 'Person',
  version: '1.0.0',
  description: 'A person.',
  attributes: [
    {
      name: 'fullName',
      type: 'string',
      key: '_.fullName',
      description: 'Full legal or preferred name',
      isRequired: true,
    },
    {
      name: 'role',
      type: 'string',
      key: '_.role',
      description: 'Role or title within the organization',
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
