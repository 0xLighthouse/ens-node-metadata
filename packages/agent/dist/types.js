/**
 * Zod schemas and inferred TypeScript types for ERC-8004 agent registration files.
 * Schema reference: https://ens-metadata-docs.vercel.app/schemas/agent
 */
import { z } from 'zod';
/** Zod schema for a service endpoint exposed by the agent. */
export const AgentServiceSchema = z.object({
    /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
    name: z.string(),
    /** URL of the service endpoint */
    endpoint: z.string(),
    /** Optional semantic version of the service */
    version: z.string().optional(),
});
/** Zod schema for an on-chain registry entry linking the agent to an agent registry. */
export const AgentRegistrationSchema = z.object({
    /** The agent's on-chain identifier within the registry */
    agentId: z.string(),
    /** Contract address or ENS name of the agent registry */
    agentRegistry: z.string(),
});
/**
 * Zod schema for the full ERC-8004 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 */
export const AgentRegistrationFileSchema = z.object({
    /** Fixed value: 'Agent' */
    type: z.literal('Agent'),
    /** Human-readable name of the agent */
    name: z.string().min(1),
    /** Human-readable description of the agent's capabilities */
    description: z.string().min(1),
    /** Optional URL to an image representing the agent */
    image: z.string().optional(),
    /** Service endpoints the agent exposes */
    services: z.array(AgentServiceSchema).default([]),
    /** Whether the agent supports HTTP 402 / x402 micro-payment flows */
    x402Support: z.boolean().default(false),
    /** Whether the agent is currently active and accepting requests */
    active: z.boolean().default(true),
    /** On-chain registry entries for this agent */
    registrations: z.array(AgentRegistrationSchema).default([]),
    /**
     * Trust models supported by the agent.
     * Common values: "reputation", "attestation", "stake", "none"
     */
    supportedTrust: z.array(z.string()).default([]),
});
