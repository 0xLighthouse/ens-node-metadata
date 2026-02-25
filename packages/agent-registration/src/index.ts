import type { AgentRegistrationFile } from './types.js'

export type { AgentService, AgentRegistration, AgentRegistrationFile } from './types.js'

/**
 * Build a complete {@link AgentRegistrationFile} from a partial input.
 * Applies sensible defaults for optional fields and throws if required fields
 * (`name`, `description`) are missing.
 */
export function buildRegistrationFile(
  input: Partial<AgentRegistrationFile>,
): AgentRegistrationFile {
  if (!input.name || input.name.trim() === '') {
    throw new Error('AgentRegistrationFile: `name` is required')
  }
  if (!input.description || input.description.trim() === '') {
    throw new Error('AgentRegistrationFile: `description` is required')
  }

  return {
    type: 'Agent',
    name: input.name,
    description: input.description,
    ...(input.image !== undefined && { image: input.image }),
    services: input.services ?? [],
    x402Support: input.x402Support ?? false,
    active: input.active ?? true,
    registrations: input.registrations ?? [],
    supportedTrust: input.supportedTrust ?? [],
  }
}

/**
 * Type guard — returns `true` if `file` is a valid {@link AgentRegistrationFile}.
 * Performs structural validation only; does not verify live service endpoints.
 */
export function validateRegistrationFile(file: unknown): file is AgentRegistrationFile {
  if (typeof file !== 'object' || file === null) return false

  const f = file as Record<string, unknown>

  if (f.type !== 'Agent') return false
  if (typeof f.name !== 'string' || f.name.trim() === '') return false
  if (typeof f.description !== 'string' || f.description.trim() === '') return false
  if (f.image !== undefined && typeof f.image !== 'string') return false
  if (!Array.isArray(f.services)) return false
  if (typeof f.x402Support !== 'boolean') return false
  if (typeof f.active !== 'boolean') return false
  if (!Array.isArray(f.registrations)) return false
  if (!Array.isArray(f.supportedTrust)) return false

  // Validate each service entry
  for (const svc of f.services as unknown[]) {
    if (typeof svc !== 'object' || svc === null) return false
    const s = svc as Record<string, unknown>
    if (typeof s.name !== 'string') return false
    if (typeof s.endpoint !== 'string') return false
    if (s.version !== undefined && typeof s.version !== 'string') return false
  }

  // Validate each registration entry
  for (const reg of f.registrations as unknown[]) {
    if (typeof reg !== 'object' || reg === null) return false
    const r = reg as Record<string, unknown>
    if (typeof r.agentId !== 'string') return false
    if (typeof r.agentRegistry !== 'string') return false
  }

  return true
}
