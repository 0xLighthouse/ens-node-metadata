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
  // Suggested nodes are placeholders for sparse trees
  isSuggested?: boolean
  // Pending creation nodes
  isPendingCreation?: boolean
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
