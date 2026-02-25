/**
 * TypeScript interfaces for ERC-8004 agent registration files.
 * Schema reference: https://ens-metadata-docs.vercel.app/schemas/agent
 */

/** A service endpoint exposed by the agent. */
export interface AgentService {
  /** Service protocol name, e.g. "MCP", "A2A", "ENS" */
  name: string
  /** URL of the service endpoint */
  endpoint: string
  /** Optional semantic version of the service */
  version?: string
}

/** An on-chain registry entry linking the agent to an agent registry. */
export interface AgentRegistration {
  /** The agent's on-chain identifier within the registry */
  agentId: string
  /** Contract address or ENS name of the agent registry */
  agentRegistry: string
}

/**
 * The full ERC-8004 agent registration file.
 * Publish this to IPFS or HTTPS and set `agent-uri` in the ENS text records.
 */
export interface AgentRegistrationFile {
  /** Fixed value: 'Agent' */
  type: 'Agent'
  /** Human-readable name of the agent */
  name: string
  /** Human-readable description of the agent's capabilities */
  description: string
  /** Optional URL to an image representing the agent */
  image?: string
  /** Service endpoints the agent exposes */
  services: AgentService[]
  /** Whether the agent supports HTTP 402 / x402 micro-payment flows */
  x402Support: boolean
  /** Whether the agent is currently active and accepting requests */
  active: boolean
  /** On-chain registry entries for this agent */
  registrations: AgentRegistration[]
  /**
   * Trust models supported by the agent.
   * Common values: "reputation", "attestation", "stake", "none"
   */
  supportedTrust: string[]
}
