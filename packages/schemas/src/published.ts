import registry from '../published/_registry.json'

export interface PublishedVersionEntry {
  cid: string
  checksum: string
  timestamp: number
  schemaPath: string
  schema?: any
  meta?: any
}

export interface PublishedSchemaData {
  latest: string
  published: Record<string, PublishedVersionEntry>
}

export interface PublishedRegistry {
  schemas: Record<string, PublishedSchemaData>
}

/**
 * Get the published registry with schema and meta data loaded for each version
 */
export async function getPublishedRegistry(): Promise<PublishedRegistry> {
  const enhancedRegistry: PublishedRegistry = {
    schemas: {},
  }

  for (const [schemaId, schemaData] of Object.entries(registry.schemas)) {
    enhancedRegistry.schemas[schemaId] = {
      latest: schemaData.latest,
      published: {},
    }

    for (const [version, versionData] of Object.entries(schemaData.published)) {
      try {
        // Dynamically import schema and meta files
        const [schemaModule, metaModule] = await Promise.all([
          import(`../published/${schemaId}/versions/${version}/schema.json`),
          import(`../published/${schemaId}/versions/${version}/meta.json`),
        ])

        enhancedRegistry.schemas[schemaId].published[version] = {
          ...versionData,
          schema: schemaModule.default || schemaModule,
          meta: metaModule.default || metaModule,
        }
      } catch (error) {
        console.error(`Failed to load schema ${schemaId} v${version}:`, error)
        enhancedRegistry.schemas[schemaId].published[version] = {
          ...versionData,
        }
      }
    }
  }

  return enhancedRegistry
}
