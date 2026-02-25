/**
 * Zod schemas and inferred TypeScript types for ERC-8004 agent registration files.
 * Schema reference: https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html
 *
 * v2.0 changes (Jan 2026):
 *  - Primary field name is now `services` (was `endpoints`)
 *  - Parsers accept `endpoints` for backward compatibility with a deprecation warning
 */
import { z } from 'zod';
/** Zod schema for a service endpoint exposed by the agent (v2.0). */
export declare const AgentServiceSchema: z.ZodObject<{
    /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
    name: z.ZodString;
    /** URL of the service endpoint */
    endpoint: z.ZodString;
    /** Optional semantic version of the service */
    version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    endpoint: string;
    version?: string | undefined;
}, {
    name: string;
    endpoint: string;
    version?: string | undefined;
}>;
/** Zod schema for an on-chain registry entry linking the agent to an agent registry. */
export declare const AgentRegistrationSchema: z.ZodObject<{
    /** The agent's on-chain identifier within the registry */
    agentId: z.ZodString;
    /** Contract address or ENS name of the agent registry */
    agentRegistry: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    agentRegistry: string;
}, {
    agentId: string;
    agentRegistry: string;
}>;
/**
 * Zod schema for the full ERC-8004 v2.0 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 *
 * Backward-compatibility: accepts `endpoints` in place of `services` and emits a
 * WA031 deprecation warning. New implementations must use `services`.
 */
export declare const AgentRegistrationFileSchema: z.ZodEffects<z.ZodObject<{
    /** Fixed value: 'Agent' */
    type: z.ZodLiteral<"Agent">;
    /** Human-readable name of the agent */
    name: z.ZodString;
    /** Human-readable description of the agent's capabilities */
    description: z.ZodString;
    /** Optional URL to an image representing the agent */
    image: z.ZodOptional<z.ZodString>;
    /** Service endpoints the agent exposes (v2.0 field name). */
    services: z.ZodOptional<z.ZodArray<z.ZodObject<{
        /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
        name: z.ZodString;
        /** URL of the service endpoint */
        endpoint: z.ZodString;
        /** Optional semantic version of the service */
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }, {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }>, "many">>;
    /**
     * Legacy field name for service endpoints (v1.x).
     * Accepted for backward compatibility — triggers WA031 deprecation warning.
     * Prefer `services`.
     */
    endpoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
        name: z.ZodString;
        /** URL of the service endpoint */
        endpoint: z.ZodString;
        /** Optional semantic version of the service */
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }, {
        name: string;
        endpoint: string;
        version?: string | undefined;
    }>, "many">>;
    /** Whether the agent supports HTTP 402 / x402 micro-payment flows */
    x402Support: z.ZodDefault<z.ZodBoolean>;
    /** Whether the agent is currently active and accepting requests */
    active: z.ZodDefault<z.ZodBoolean>;
    /** On-chain registry entries for this agent */
    registrations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        /** The agent's on-chain identifier within the registry */
        agentId: z.ZodString;
        /** Contract address or ENS name of the agent registry */
        agentRegistry: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        agentId: string;
        agentRegistry: string;
    }, {
        agentId: string;
        agentRegistry: string;
    }>, "many">>;
    /**
     * Trust models supported by the agent.
     * Common values: "reputation", "attestation", "stake", "none"
     */
    supportedTrust: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "Agent";
    description: string;
    x402Support: boolean;
    active: boolean;
    registrations: {
        agentId: string;
        agentRegistry: string;
    }[];
    supportedTrust: string[];
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
}, {
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
}>, {
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
    /** Internal flag set when `endpoints` was used instead of `services`. */
    _legacyEndpoints: boolean;
}, {
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
}>;
/** Parsed + normalized ERC-8004 registration file. */
export type AgentRegistrationFile = z.infer<typeof AgentRegistrationFileSchema>;
/** A service endpoint exposed by the agent. */
export type AgentService = z.infer<typeof AgentServiceSchema>;
/** An on-chain registry entry linking the agent to an agent registry. */
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
export declare const AgentMetadataPayloadSchema: z.ZodEffects<z.ZodEffects<z.ZodRecord<z.ZodString, z.ZodString>, Record<string, string>, Record<string, string>>, Record<string, string>, Record<string, string>>;
export type AgentMetadataPayload = z.infer<typeof AgentMetadataPayloadSchema>;
//# sourceMappingURL=types.d.ts.map