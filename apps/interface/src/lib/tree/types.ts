export type TreeNodeType = 'default' | 'organizationRoot' | 'treasury' | 'role' | 'team'


/**
 * An ENS record/subdomain fetched from the subgraph and normalized into a tree node
 */
export interface NormalizedTreeNode {
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
   * (Optional) address this node points to
   */
  address?: `0x${string}` | null
  /**
   * The address of the owner of the node derived from [ownerId] or [wrappedOwnerId]
   */
  owner: `0x${string}`
  // Optional metadata for display
  ttl?: number | null
  icon?: string
  /**
   * (Optional) children of this node
   */
  children?: TreeNodes[]
  attributes?: Record<string, string | null>
  // Additional fields (will be refactored to BaseNode, TreasuryNode, etc later)
  title?: string // String(255)
  kind?: string // Display label (e.g., Safe, EOA, Role, Team)
  description?: string // Text(Markdown) - human-readable explanation
  type?: string // Node type for custom rendering (e.g., 'Treasury', 'Contract')
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
    computedChildren?: TreeNodes[] // New computed child nodes (e.g., signers)
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

// Alias for compatibility
export type TreeNodes = TreeNode
