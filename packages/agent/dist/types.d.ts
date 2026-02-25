/**
 * Zod schemas and inferred TypeScript types for ERC-8004 agent registration files.
 * Schema reference: https://ens-metadata-docs.vercel.app/schemas/agent
 */
import { z } from 'zod';
/** Zod schema for a service endpoint exposed by the agent. */
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
 * Zod schema for the full ERC-8004 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 */
export declare const AgentRegistrationFileSchema: z.ZodObject<{
    /** Fixed value: 'Agent' */
    type: z.ZodLiteral<"Agent">;
    /** Human-readable name of the agent */
    name: z.ZodString;
    /** Human-readable description of the agent's capabilities */
    description: z.ZodString;
    /** Optional URL to an image representing the agent */
    image: z.ZodOptional<z.ZodString>;
    /** Service endpoints the agent exposes */
    services: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    x402Support?: boolean | undefined;
    active?: boolean | undefined;
    registrations?: {
        agentId: string;
        agentRegistry: string;
    }[] | undefined;
    supportedTrust?: string[] | undefined;
}>;
/** A service endpoint exposed by the agent. */
export type AgentService = z.infer<typeof AgentServiceSchema>;
/** An on-chain registry entry linking the agent to an agent registry. */
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>;
/**
 * The full ERC-8004 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 */
export type AgentRegistrationFile = z.infer<typeof AgentRegistrationFileSchema>;
//# sourceMappingURL=types.d.ts.map