import { z } from 'zod'
import {
  AgentRegistrationFileSchema,
  AgentRegistrationSchema,
  AgentServiceSchema,
} from './types.js'

export type {
  AgentService,
  AgentRegistration,
  AgentRegistrationFile,
  AgentMetadataPayload,
} from './types.js'
export {
  AgentServiceSchema,
  AgentRegistrationSchema,
  AgentRegistrationFileSchema,
  AgentMetadataPayloadSchema,
} from './types.js'

/**
 * Input schema for {@link buildRegistrationFile}.
 * `type` defaults to `'Agent'`; `description` defaults to `''`.
 * All other optional fields receive sensible defaults.
 */
const BuildInputSchema = z
  .object({
    type: z.literal('Agent').default('Agent'),
    name: z.string().min(1),
    description: z.string().default(''),
    image: z.string().optional(),
    services: z.array(AgentServiceSchema).default([]),
    x402Support: z.boolean().default(false),
    active: z.boolean().default(true),
    registrations: z.array(AgentRegistrationSchema).default([]),
    supportedTrust: z.array(z.string()).default([]),
  })
  .strict()

/**
 * Build a complete `AgentRegistrationFile` from a partial input.
 * Applies sensible defaults for optional fields and throws if required fields
 * are missing or fail validation.
 * Unknown keys are stripped via Zod `.strict()` + `.parse()`.
 */
export function buildRegistrationFile(input: Record<string, unknown>) {
  return BuildInputSchema.parse(input)
}

/**
 * Validate an unknown value against the `AgentRegistrationFile` schema.
 * Returns a Zod `SafeParseReturnType` — check `.success` for pass/fail,
 * and `.error` for structured validation errors.
 *
 * WA031: if the file uses the legacy `endpoints` field instead of `services`,
 * the returned value will have `_legacyEndpoints: true`.
 */
export function validateRegistrationFile(file: unknown) {
  return AgentRegistrationFileSchema.safeParse(file)
}
