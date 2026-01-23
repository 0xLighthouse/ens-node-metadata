import { GraphQLClient, type RequestDocument, gql } from 'graphql-request'
import type { NormalizedTreeNode, TreeNode } from '@/lib/tree/types'
import { fetchTexts } from './fetchTexts'


const ENS_SUBGRAPH_URL = 'https://api.alpha.ensnode.io/subgraph'

type ENSRecord = {
  id: string
  ownerId: string
  wrappedOwnerId: string
  name: string | null
  subdomainCount?: number | string
  ttl?: number | string | null
  resolvedAddress?: {
    id: string
  }
  resolver: {
    id: string
    address: string
    texts: string[]
  }
}

type RequestFn = <T>(
  query: RequestDocument,
  variables?: Record<string, unknown>,
) => Promise<T>

export type BuildTreeOptions = {
  endpoint?: string
  maxConcurrency?: number
  pageSize?: number
}

export const RESOLVE_DOMAIN_BY_NAME = gql`
  query ResolveDomainByName($name: String!) {
    domains(where: { name: $name }) {
      id
      name
      subdomainCount
      ttl
      resolver {
        id
        address
        texts
      }
      resolvedAddress {
        id
      }
      ownerId
      wrappedOwnerId
    }
  }
`

const RESSOLVE_CHILDREN_BY_PARENT_ID = gql`
  query ResolveChildrenByParentId($parentId: String!, $first: Int!, $skip: Int!) {
    domains(where: { parent: $parentId }, first: $first, skip: $skip) {
      id
      name
      subdomainCount
      ttl
      resolver {
        id
        address
        texts
      }
      resolvedAddress {
        id
      }
      owner {
        id
      }
    }
  }
`

export async function buildRawTree(rootName: string,): Promise<TreeNode> {
  const endpoint = ENS_SUBGRAPH_URL
  const request = withRetry(createGraphRequest(endpoint))
  const pageSize = 1000

  const root = await request<{ domains: ENSRecord[] }>(RESOLVE_DOMAIN_BY_NAME, {
    name: rootName,
  })

  const rootDomain = root.domains?.[0]
  if (!rootDomain) {
    throw new Error(`Domain not found in subgraph: ${rootName}`)
  }

  const buildNode = async (indexed: ENSRecord): Promise<NormalizedTreeNode | undefined> => {
    const resolvedAddress = indexed.resolvedAddress?.id as `0x${string}`
    const owner = (indexed.wrappedOwnerId ?? indexed.ownerId) as `0x${string}`
    const ttl = indexed.ttl == null ? null : Number(indexed.ttl)

    // If a node does not have a resolve treat is as deleted
    if (!indexed.resolver) {
      return undefined
    }

    const node: NormalizedTreeNode = {
      id: indexed.id,
      name: indexed.name ?? indexed.id,
      address: resolvedAddress === '0x0000000000000000000000000000000000000000' ? null : resolvedAddress,
      resolverId: indexed.resolver.id,
      resolverAddress: indexed.resolver.address,
      owner,
      ttl,
      subdomainCount: 0,
      children: [],
    }

    // If the resolver has texts, fetch them and add them to the node's attributes
    if (indexed.name && indexed.resolver.texts) {
      const texts = await fetchTexts(indexed.name, indexed.resolver?.texts)
      if (Object.keys(texts).length > 0) {
        node.attributes = texts
      }
    }

    const subdomainCount = Number(indexed.subdomainCount ?? 0)
    if (subdomainCount > 0) {
      const children = await paginateChildren(request, indexed.id, pageSize)

      for await (const child of children) {
        const childNode = await buildNode(child)
        if (childNode) {
          node.children?.push(childNode)
        }
      }
    }

    node.resolverId = indexed.resolver.id
    node.resolverAddress = indexed.resolver.address
    node.subdomainCount = subdomainCount

    return node
  }

  const tree = await buildNode(rootDomain)

  return tree
}

async function paginateChildren(
  request: RequestFn,
  parentId: string,
  pageSize: number,
): Promise<ENSRecord[]> {
  const out: ENSRecord[] = []
  let skip = 0

  while (true) {
    const res = await request<{ domains: ENSRecord[] }>(RESSOLVE_CHILDREN_BY_PARENT_ID, {
      parentId,
      first: pageSize,
      skip,
    })

    const batch = res.domains ?? []
    if (batch.length === 0) break

    out.push(...batch)
    if (batch.length < pageSize) break
    skip += pageSize
  }

  return out
}

function createGraphRequest(endpoint: string): RequestFn {
  const client = new GraphQLClient(endpoint)
  return (query, variables) => client.request(query, variables)
}

type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

function withRetry(request: RequestFn, options: RetryOptions = {}): RequestFn {
  const retries = options.retries ?? 3
  const baseDelayMs = options.baseDelayMs ?? 200
  const maxDelayMs = options.maxDelayMs ?? 2_000

  return async (query, variables) => {
    let attempt = 0
    while (true) {
      try {
        return await request(query, variables)
      } catch (error) {
        if (attempt >= retries) throw error
        const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
        const jitter = Math.random() * delay
        await new Promise((resolve) => setTimeout(resolve, jitter))
        attempt += 1
      }
    }
  }
}
