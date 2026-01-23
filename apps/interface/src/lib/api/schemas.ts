import type { Schema } from '@/stores/schemas'
import { SCHEMAS } from '@ensipXX/schemas'

/**
 * Fetch all available schemas from the schemas package
 */
export async function fetchSchemas(): Promise<Schema[]> {
  // Map schemas from the package to our Schema interface
  return SCHEMAS.map((schema) => ({
    ...schema,
    id: `${schema.name.toLowerCase().replace(/\s+/g, '-')}-v${schema.version}`,
    directory: `schemas/${schema.name.toLowerCase().replace(/\s+/g, '-')}`,
    branch: 'main',
  }))
}

/**
 * Fetch a specific schema by ID
 */
export async function fetchSchemaById(id: string): Promise<Schema | null> {
  // TODO: Replace with actual API call
  const schemas = await fetchSchemas()
  return schemas.find((s) => s.id === id) || null
}

/**
 * Fetch the latest version of a schema by name
 */
export async function fetchLatestSchemaByName(name: string): Promise<Schema | null> {
  // TODO: Replace with actual API call
  const schemas = await fetchSchemas()
  return schemas.find((s) => s.name === name) || null
}
