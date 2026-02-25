import { z } from 'zod';
import { AgentRegistrationFileSchema } from './types.js';
export type { AgentService, AgentRegistration, AgentRegistrationFile } from './types.js';
export { AgentServiceSchema, AgentRegistrationSchema, AgentRegistrationFileSchema, } from './types.js';
/**
 * Build a complete `AgentRegistrationFile` from a partial input.
 * Applies sensible defaults for optional fields and throws if required fields
 * are missing or fail validation.
 * Unknown keys are stripped via Zod `.strict()` + `.parse()`.
 */
export declare function buildRegistrationFile(input: Record<string, unknown>): z.infer<typeof AgentRegistrationFileSchema>;
/**
 * Validate an unknown value against the `AgentRegistrationFile` schema.
 * Returns a Zod `SafeParseReturnType` — check `.success` for pass/fail,
 * and `.error` for structured validation errors.
 */
export declare function validateRegistrationFile(file: unknown): z.SafeParseReturnType<unknown, z.infer<typeof AgentRegistrationFileSchema>>;
//# sourceMappingURL=index.d.ts.map