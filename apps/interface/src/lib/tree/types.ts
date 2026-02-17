export type TreeNodeType = 'default' | 'organizationRoot' | 'treasury' | 'role' | 'team'


/**
 * An ENS record/subdomain fetched from the subgraph and normalized into a tree node
 */
export interface NormalizedTreeNode {
  [key: string]: unknown

  /**
   * The ID of the node as expressed on-chain
   */
  id: string

  /**
   * The name of the node as expressed on-chain (e.g. "ens.eth")
   */
  name: string

  /**
   * The number of subdomains this node has
   */
  subdomainCount: number
  resolverId: string
  resolverAddress: string

  /**
   * The ID of the parent node
   */
  parentId?: string

  /**
   * (Optional) address this node points to
   */
  address?: `0x${string}`

  /**
   * The address of the owner of the node derived from [ownerId] or [wrappedOwnerId]
   */
  owner: `0x${string}`

  /**
   * (Optional) ENS name for the owner address
   */
  ownerEnsName?: string | null

  /**
   * (Optional) ENS avatar URL for the owner address
   */
  ownerEnsAvatar?: string | null

  // Optional metadata for display
  ttl?: number

  /**
   * (Optional) children of this node
   */
  children?: TreeNode[]

  texts?: Record<string, string | null>

  // Additional fields (will be refactored to BaseNode, TreasuryNode, etc later)
  schema?: string // Schema ID used for this node
  // Suggested nodes are placeholders for sparse trees
  isSuggested?: boolean
  // Pending creation nodes
  isPendingCreation?: boolean
  // Computed nodes (derived from on-chain data, not user-created)
  isComputed?: boolean
  // Inspection metadata from on-chain detection
  inspectionData?: {
    detectedType?: string
    metadata?: Record<string, any>
    inspectedAt?: string
    isInspecting?: boolean
    computedChildren?: TreeNode[] // New computed child nodes (e.g., signers)
    computedReferences?: string[] // References to existing nodes by name (edges only, no new nodes)
  }
}

export interface DefaultTreeNode extends NormalizedTreeNode {
  // Omit nodeType for unknown kinds to fall back to generic.
  nodeType?: 'default'
}

export interface TreasuryTreeNode extends NormalizedTreeNode {
  nodeType: 'treasury'
}

export interface OrganizationRootTreeNode extends NormalizedTreeNode {
  nodeType: 'organizationRoot'
  website?: string
  email?: string
  organizationAddress?: string
}

export interface RoleTreeNode extends NormalizedTreeNode {
  nodeType: 'role'
}

export interface TeamTreeNode extends NormalizedTreeNode {
  nodeType: 'team'
}

export type TreeNode =
  | DefaultTreeNode
  | OrganizationRootTreeNode
  | TreasuryTreeNode
  | RoleTreeNode
  | TeamTreeNode
