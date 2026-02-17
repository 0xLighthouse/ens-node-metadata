import { Schema } from "./types";

import { AGENT_SCHEMA } from "./schemas/agent";
import { APPLICATION_SCHEMA } from "./schemas/application";
import { COMMITTEE_SCHEMA } from "./schemas/committee";
import { CONTRACT_SCHEMA } from "./schemas/contract";
import { ORGANIZATION_SCHEMA } from "./schemas/org";
import { PERSON_SCHEMA } from "./schemas/person";
import { TREASURY_SCHEMA } from "./schemas/treasury";
import { WALLET_SCHEMA } from "./schemas/wallet";
import { WORKGROUP_SCHEMA } from "./schemas/workgroup";
import { GRANT_SCHEMA } from "./schemas/grant";
import { COUNCIL_SCHEMA } from "./schemas/council";
import { DELEGATE_SCHEMA } from "./schemas/delegate";
import { GROUP_SCHEMA } from "./schemas/group";

export const SCHEMAS: Schema[] = [
  AGENT_SCHEMA,
  APPLICATION_SCHEMA,
  COMMITTEE_SCHEMA,
  CONTRACT_SCHEMA,
  COUNCIL_SCHEMA,
  DELEGATE_SCHEMA,
  GRANT_SCHEMA,
  GROUP_SCHEMA,
  PERSON_SCHEMA,
  ORGANIZATION_SCHEMA,
  COMMITTEE_SCHEMA,
  WORKGROUP_SCHEMA,
  WALLET_SCHEMA,
  TREASURY_SCHEMA,
]

