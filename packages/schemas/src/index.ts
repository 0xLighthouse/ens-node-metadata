import { Schema } from "./types";

import { COMMITTEE_SCHEMA } from "./committee";
import { CONTRACT_SCHEMA } from "./contract";
import { LOCATION_SCHEMA } from "./location";
import { OFFICE_SCHEMA } from "./office";
import { ORGANIZATION_SCHEMA } from "./org";
import { PERSON_SCHEMA } from "./person";
import { TREASURY_SCHEMA } from "./treasury";
import { WALLET_SCHEMA } from "./wallet";
import { WORKGROUP_SCHEMA } from "./workgroup";

export const SCHEMAS: Schema[] = [
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


