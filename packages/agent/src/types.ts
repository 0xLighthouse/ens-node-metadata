/**
 * Zod schemas and inferred TypeScript types for ERC-8004 agent registration files.
 * Schema reference: https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html
 *
 * v2.0 changes (Jan 2026):
 *  - Primary field name is now `services` (was `endpoints`)
 *  - Parsers accept `endpoints` for backward compatibility with a deprecation warning
 */
import { z } from 'zod'

/** Zod schema for a service endpoint exposed by the agent (v2.0). */
export const AgentServiceSchema = z.object({
  /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
  name: z.string(),
  /** URL of the service endpoint */
  endpoint: z.string(),
  /** Optional semantic version of the service */
  version: z.string().optional(),
})

/** Zod schema for an on-chain registry entry linking the agent to an agent registry. */
export const AgentRegistrationSchema = z.object({
  /** The agent's on-chain identifier within the registry */
  agentId: z.string(),
  /** Contract address or ENS name of the agent registry */
  agentRegistry: z.string(),
})

/**
 * Zod schema for the full ERC-8004 v2.0 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 *
 * Backward-compatibility: accepts `endpoints` in place of `services` and emits a
 * WA031 deprecation warning. New implementations must use `services`.
 */
export const AgentRegistrationFileSchema = z
  .object({
    /** Fixed value: 'Agent' */
    type: z.literal('Agent'),
    /** Human-readable name of the agent */
    name: z.string().min(1),
    /** Human-readable description of the agent's capabilities */
    description: z.string().min(1),
    /** Optional URL to an image representing the agent */
    image: z.string().optional(),
    /** Service endpoints the agent exposes (v2.0 field name). */
    services: z.array(AgentServiceSchema).optional(),
    /**
     * Legacy field name for service endpoints (v1.x).
     * Accepted for backward compatibility — triggers WA031 deprecation warning.
     * Prefer `services`.
     */
    endpoints: z.array(AgentServiceSchema).optional(),
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
  })
  .transform((data) => {
    // Backward compat: if only `endpoints` is present, use it as `services`
    const services = data.services ?? data.endpoints ?? []
    return {
      type: data.type,
      name: data.name,
      description: data.description,
      image: data.image,
      services,
      x402Support: data.x402Support,
      active: data.active,
      registrations: data.registrations,
      supportedTrust: data.supportedTrust,
      /** Internal flag set when `endpoints` was used instead of `services`. */
      _legacyEndpoints: data.endpoints !== undefined && data.services === undefined,
    }
  })

/** Parsed + normalized ERC-8004 registration file. */
export type AgentRegistrationFile = z.infer<typeof AgentRegistrationFileSchema>

/** A service endpoint exposed by the agent. */
export type AgentService = z.infer<typeof AgentServiceSchema>

/** An on-chain registry entry linking the agent to an agent registry. */
export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>

// ---------------------------------------------------------------------------
// ENS metadata payload schema (the flat text-record object for ENS)
// ---------------------------------------------------------------------------

export const AgentMetadataPayloadSchema = z
  .record(z.string(), z.string())
  .refine((obj) => obj.class === 'Agent', {
    message: 'class must be "Agent"',
    path: ['class'],
  })
  .refine((obj) => !!obj['agent-uri'], {
    message: 'agent-uri is required',
    path: ['agent-uri'],
  })

export type AgentMetadataPayload = z.infer<typeof AgentMetadataPayloadSchema>
