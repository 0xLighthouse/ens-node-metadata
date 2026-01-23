import { Schema } from "../types";

export const ENSIP5: Schema = {
  source: 'https://docs.ens.domains/ensip/5',
  name: 'ENSIP-5',
  version: '1.0.0',
  description: 'A group of entities that have been empowered by a larger organization to undertake some activity.',
  attributes: [
    //     Global Keys
    {
      name: 'avatar',
      type: 'string',
      key: 'avatar',
      description: 'A URL to an image used as an avatar or logo',
      isRequired: false,
    },
    {
      name: 'description',
      type: 'string',
      key: 'description',
      description: 'A description of the name',
      isRequired: false,
    },
    {
      name: 'display',
      type: 'string',
      key: 'display',
      description: 'A canonical display name for the ENS name; this MUST match the ENS name when its case is folded, and clients should ignore this value if it does not (e.g. "ricmoo.eth" could set this to "RicMoo.eth")',
      isRequired: false,
    },
    {
      name: 'email',
      type: 'string',
      key: 'email',
      description: 'An e-mail address',
      isRequired: false,
    },
    {
      name: 'keywords',
      type: 'string',
      key: 'keywords',
      description: 'A list of comma-separated keywords, ordered by most significant first; clients that interpresent this field may choose a threshold beyond which to ignore',
      isRequired: false,
    },
    {
      name: 'mail',
      type: 'string',
      key: 'mail',
      description: 'A physical mailing address',
      isRequired: false,
    },
    {
      name: 'notice',
      type: 'string',
      key: 'notice',
      description: 'A notice regarding this name',
      isRequired: false,
    },
    {
      name: 'location',
      type: 'string',
      key: 'location',
      description: 'A generic location (e.g. "Toronto, Canada")',
      isRequired: false,
    },
    {
      name: 'phone',
      type: 'string',
      key: 'phone',
      description: 'A phone number as an E.164 string',
      isRequired: false,
    },
    {
      name: 'url',
      type: 'string',
      key: 'url',
      description: 'A website URL',
      isRequired: false,
    },
  ],
}
