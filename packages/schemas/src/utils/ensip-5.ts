import { Schema } from "../types";

export const ENSIP5: Schema = {
  $id: 'https://docs.ens.domains/ensip/5/schema/1.0.0',
  source: 'https://docs.ens.domains/ensip/5',
  title: 'ENSIP-5',
  version: '1.0.0',
  description: 'A group of entities that have been empowered by a larger organization to undertake some activity.',
  type: 'object' as const,
  properties: {
    avatar: {
      type: 'string',
      description: 'A URL to an image used as an avatar or logo',
      isRequired: false,
    },
    description: {
      type: 'string',
      description: 'A description of the name',
      isRequired: false,
    },
    display: {
      type: 'string',
      description: 'A canonical display name for the ENS name; this MUST match the ENS name when its case is folded, and clients should ignore this value if it does not (e.g. "ricmoo.eth" could set this to "RicMoo.eth")',
      isRequired: false,
    },
    email: {
      type: 'string',
      description: 'An e-mail address',
      isRequired: false,
    },
    keywords: {
      type: 'string',
      description: 'A list of comma-separated keywords, ordered by most significant first; clients that interpresent this field may choose a threshold beyond which to ignore',
      isRequired: false,
    },
    mail: {
      type: 'string',
      description: 'A physical mailing address',
      isRequired: false,
    },
    notice: {
      type: 'string',
      description: 'A notice regarding this name',
      isRequired: false,
    },
    location: {
      type: 'string',
      description: 'A generic location (e.g. "Toronto, Canada")',
      isRequired: false,
    },
    phone: {
      type: 'string',
      description: 'A phone number as an E.164 string',
      isRequired: false,
    },
    url: {
      type: 'string',
      description: 'A website URL',
      isRequired: false,
    },
  }
}
