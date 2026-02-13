import { GraphQLClient, type RequestDocument, gql } from 'graphql-request'
import type { NormalizedTreeNode, TreeNode } from '@/lib/tree/types'
import { fetchTexts } from './fetchTexts'
import { mapNamesByAddress } from './mapNamesByAddress'


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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const RESOLVE_CHILDREN_BY_PARENT_ID = gql`
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
      ownerId
      wrappedOwnerId
    }
  }
`

// Helper to collect all unique owner addresses from the tree
function collectOwnerAddresses(node: NormalizedTreeNode): Set<`0x${string}`> {
  const addresses = new Set<`0x${string}`>()
  addresses.add(node.owner)

  if (node.children) {
    for (const child of node.children) {
      const childAddresses = collectOwnerAddresses(child)
      childAddresses.forEach((addr) => addresses.add(addr))
    }
  }

  return addresses
}

// Helper to assign ENS names to nodes
function assignEnsNames(
  node: NormalizedTreeNode,
  nameMap: Map<`0x${string}`, string | null>,
): void {
  node.ownerEnsName = nameMap.get(node.owner) ?? null

  if (node.children) {
    for (const child of node.children) {
      assignEnsNames(child, nameMap)
    }
  }
}

export async function buildRawTree(rootName: string,): Promise<TreeNode | undefined> {
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

    // If the node is owned by the zero address, omit it
    if (owner === ZERO_ADDRESS) {
      return undefined
    }

    // If a node does not have a resolver, omit it
    if (!indexed.resolver) {
      return undefined
    }

    const node: NormalizedTreeNode = {
      id: indexed.id,
      name: indexed.name ?? indexed.id,
      address: resolvedAddress === ZERO_ADDRESS ? null : resolvedAddress,
      resolverId: indexed.resolver.id,
      resolverAddress: indexed.resolver.address,
      owner,
      ttl,
      subdomainCount: 0,
      children: [],
    }

    // If the resolver has texts, fetch them and add them to the node's attributes
    if (indexed.name && indexed.resolver.texts) {
      try {
        const texts = await fetchTexts(indexed.name, indexed.resolver?.texts)
        if (Object.keys(texts).length > 0) {
          node.attributes = texts
        }
      } catch (error) {
        console.warn('Error fetching texts for', indexed.name, error)
      }
    }

    const subdomainCount = Number(indexed.subdomainCount ?? 0)
    if (subdomainCount > 0) {
      const children = await paginateChildren(request, indexed.id, pageSize)

      for await (const child of children) {
        const childNode = await buildNode(child)
        if (childNode) {
          childNode.parentId = indexed.id
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

  if (!tree) {
    return undefined
  }

  // Collect all unique owner addresses
  const ownerAddresses = collectOwnerAddresses(tree)

  // Fetch ENS names for all addresses
  const ensNameMap = await mapNamesByAddress(Array.from(ownerAddresses))

  // Assign ENS names to all nodes
  assignEnsNames(tree, ensNameMap)

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
    const res = await request<{ domains: ENSRecord[] }>(RESOLVE_CHILDREN_BY_PARENT_ID, {
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
