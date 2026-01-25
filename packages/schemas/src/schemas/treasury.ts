import { Schema } from "../types";
import { GITHUB_URL } from "../config/constants";

export const TREASURY_SCHEMA: Schema = {
  source: GITHUB_URL,
  name: 'Treasury',
  version: '1.0.0',
  description: 'A treasury for managing organizational funds and assets.',
  attributes: [
    {
      name: 'name',
      type: 'string',
      key: '_.name',
      description: 'The name of the treasury',
      isRequired: true,
    },
    {
      name: 'description',
      type: 'string',
      key: '_.description',
      description: 'Description of the treasury purpose',
      isRequired: false,
    },
    {
      name: 'type',
      type: 'string',
      key: '_.type',
      description: 'Treasury type (e.g., Multisig, Safe, DAO)',
      isRequired: false,
    },
    {
      name: 'chainId',
      type: 'string',
      key: '_.chainId',
      description: 'Chain ID where the treasury is deployed',
      isRequired: false,
    },
    {
      name: 'threshold',
      type: 'string',
      key: '_.threshold',
      description: 'Signing threshold (e.g., 3/5)',
      isRequired: false,
    },
  ],
}
