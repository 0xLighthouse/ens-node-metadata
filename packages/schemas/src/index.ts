import { Schema } from "./types";

import { APPLICATION_SCHEMA } from "./schemas/application";
import { COMMITTEE_SCHEMA } from "./schemas/committee";
import { CONTRACT_SCHEMA } from "./schemas/contract";
import { LOCATION_SCHEMA } from "./schemas/location";
import { OFFICE_SCHEMA } from "./schemas/office";
import { ORGANIZATION_SCHEMA } from "./schemas/org";
import { PERSON_SCHEMA } from "./schemas/person";
import { TREASURY_SCHEMA } from "./schemas/treasury";
import { WALLET_SCHEMA } from "./schemas/wallet";
import { WORKGROUP_SCHEMA } from "./schemas/workgroup";

export const SCHEMAS: Schema[] = [
  APPLICATION_SCHEMA,
  CONTRACT_SCHEMA,
  PERSON_SCHEMA,
  LOCATION_SCHEMA,
  ORGANIZATION_SCHEMA,
  COMMITTEE_SCHEMA,
  OFFICE_SCHEMA,
  WORKGROUP_SCHEMA,
  WALLET_SCHEMA,
  TREASURY_SCHEMA,
]


