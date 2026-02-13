import { normalize } from 'viem/ens'
import type { GetMetadataOptions, GetMetadataResult } from './types'

const DEFAULT_KEYS = [
  'schema',
  'class',
  'schemaVersion',
  'schemaCid',
  'description',
  'avatar',
  'url',
]

function pickFirst(
  texts: Record<string, string | null>,
  candidates: string[],
): string | null {
  for (const key of candidates) {
    const value = texts[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return null
}

function normalizeResolverAddress(resolver: unknown): string | null {
  if (!resolver) return null
  if (typeof resolver === 'string') return resolver
  if (typeof resolver === 'object' && resolver !== null && 'address' in resolver) {
    const address = (resolver as { address?: unknown }).address
    return typeof address === 'string' ? address : null
  }
  return null
}

export async function getMetadata(options: GetMetadataOptions): Promise<GetMetadataResult> {
  const {
    publicClient,
    name,
    keys = DEFAULT_KEYS,
    coinType = 60,
    normalizeName = true,
    blockNumber,
    blockTag,
    gatewayUrls,
    strict,
    universalResolverAddress,
  } = options

  if (!publicClient) {
    throw new Error('getMetadata requires a viem publicClient')
  }

  const normalizedName = normalizeName ? normalize(name) : name
  const uniqueKeys = [...new Set(keys)]

  const commonOptions = {
    ...(blockNumber !== undefined ? { blockNumber } : {}),
    ...(blockTag !== undefined ? { blockTag } : {}),
  }

  const textOptions = {
    ...commonOptions,
    ...(gatewayUrls !== undefined ? { gatewayUrls } : {}),
    ...(strict !== undefined ? { strict } : {}),
    ...(universalResolverAddress !== undefined ? { universalResolverAddress } : {}),
  }

  const [resolverValue, addressValue, textResults] = await Promise.all([
    publicClient.getEnsResolver({ name: normalizedName, ...commonOptions }).catch(() => null),
    publicClient
      .getEnsAddress({
        name: normalizedName,
        coinType,
        ...commonOptions,
      })
      .catch(() => null),
    Promise.all(
      uniqueKeys.map(async (key) => {
        try {
          const value = await publicClient.getEnsText({
            name: normalizedName,
            key,
            ...textOptions,
          })
          return [key, value ?? null] as const
        } catch {
          return [key, null] as const
        }
      }),
    ),
  ])

  const texts: Record<string, string | null> = Object.fromEntries(textResults)

  const schema = pickFirst(texts, ['schema', 'ens.schema', 'record.schema'])
  const cls = pickFirst(texts, ['class', 'ens.class', 'record.class'])
  const version = pickFirst(texts, [
    'schemaVersion',
    'schema-version',
    'version',
    'record.version',
  ])
  const cid = pickFirst(texts, ['schemaCid', 'schema-cid', 'cid', 'record.cid'])

  return {
    name: normalizedName,
    resolver: normalizeResolverAddress(resolverValue),
    address: typeof addressValue === 'string' ? addressValue : null,
    texts,
    schema,
    class: cls,
    version,
    cid,
  }
}

export type { GetMetadataOptions, GetMetadataResult } from './types'

