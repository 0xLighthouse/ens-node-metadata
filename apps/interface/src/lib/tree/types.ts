export type TreeNodeType = 'default' | 'organizationRoot' | 'treasury' | 'role' | 'team'

export interface BaseTreeNode {
  name: string
  subdomainCount: number
  children?: TreeNodes[]
  resolverId?: string
  address: `0x${string}`
  // TODO: Get manager
  // manager?: `0x${string}`
  // managerName?: string
  owner: `0x${string}`
  // Optional metadata for display
  ttl?: number | null
  icon?: string
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
    computedChildren?: TreeNodes[] // Computed child nodes (e.g., signers)
  }
}

export interface DefaultTreeNode extends BaseTreeNode {
  // Omit nodeType for unknown kinds to fall back to generic.
  nodeType?: 'default'
}

export interface TreasuryTreeNode extends BaseTreeNode {
  nodeType: 'treasury'
}

export interface OrganizationRootTreeNode extends BaseTreeNode {
  nodeType: 'organizationRoot'
  website?: string
  email?: string
  organizationAddress?: string
}

export interface RoleTreeNode extends BaseTreeNode {
  nodeType: 'role'
}

export interface TeamTreeNode extends BaseTreeNode {
  nodeType: 'team'
}

export type TreeNode =
  | DefaultTreeNode
  | OrganizationRootTreeNode
  | TreasuryTreeNode
  | RoleTreeNode
  | TeamTreeNode
