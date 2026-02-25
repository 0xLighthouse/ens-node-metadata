import { z } from 'zod';
export type { AgentService, AgentRegistration, AgentRegistrationFile, AgentMetadataPayload, } from './types.js';
export { AgentServiceSchema, AgentRegistrationSchema, AgentRegistrationFileSchema, AgentMetadataPayloadSchema, } from './types.js';
/**
 * Build a complete `AgentRegistrationFile` from a partial input.
 * Applies sensible defaults for optional fields and throws if required fields
 * are missing or fail validation.
 * Unknown keys are stripped via Zod `.strict()` + `.parse()`.
 */
export declare function buildRegistrationFile(input: Record<string, unknown>): {
    name: string;
    type: "Agent";
    description: string;
    services: {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }[];
    x402Support: boolean;
    active: boolean;
    registrations: {
        agentId: string;
        agentRegistry: string;
    }[];
    supportedTrust: string[];
    image?: string | undefined;
};
/**
 * Validate an unknown value against the `AgentRegistrationFile` schema.
 * Returns a Zod `SafeParseReturnType` — check `.success` for pass/fail,
 * and `.error` for structured validation errors.
 *
 * WA031: if the file uses the legacy `endpoints` field instead of `services`,
 * the returned value will have `_legacyEndpoints: true`.
 */
export declare function validateRegistrationFile(file: unknown): z.SafeParseReturnType<{
    name: string;
    type: "Agent";
    description: string;
    image?: string | undefined;
    services?: {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }[] | undefined;
    endpoints?: {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }[] | undefined;
    x402Support?: boolean | undefined;
    active?: boolean | undefined;
    registrations?: {
        agentId: string;
        agentRegistry: string;
    }[] | undefined;
    supportedTrust?: string[] | undefined;
}, {
    type: "Agent";
    name: string;
    description: string;
    image: string | undefined;
    services: {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }[];
    x402Support: boolean;
    active: boolean;
    registrations: {
        agentId: string;
        agentRegistry: string;
    }[];
    supportedTrust: string[];
    _legacyEndpoints: boolean;
}>;
//# sourceMappingURL=index.d.ts.map