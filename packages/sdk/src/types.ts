export interface RawMetadataInput {
  cid?: string | null
  schemaId?: string | null
  version?: string | null
  data?: Record<string, unknown> | null
}

export interface ParsedMetadata {
  schema: string | null
  version: string | null
  cid: string | null
  data: Record<string, unknown>
  raw: Record<string, unknown>
}

export interface GetMetadataOptions {
  publicClient: any
  name: string
  keys?: string[]
  coinType?: number
  normalizeName?: boolean
  blockNumber?: bigint
  blockTag?: 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized'
  gatewayUrls?: string[]
  strict?: boolean
  universalResolverAddress?: string
}

export interface GetMetadataResult {
  name: string
  resolver: string | null
  address: string | null
  texts: Record<string, string | null>
  schema: string | null
  class: string | null
  version: string | null
  cid: string | null
}
