export type TreeNodeType = 'generic' | 'organizationRoot' | 'treasury' | 'role' | 'team'

export interface BaseTreeNode {
  name: string
  children?: DomainTreeNode[]
  // Optional metadata for display
  address?: string
  icon?: string
  // Additional fields (will be refactored to BaseNode, TreasuryNode, etc later)
  title?: string // String(255)
  kind?: string // Display label (e.g., Safe, EOA, Role, Team)
  description?: string // Text(Markdown) - human-readable explanation
  // Suggested nodes are placeholders for sparse trees
  isSuggested?: boolean
  // Pending creation nodes
  isPendingCreation?: boolean
}

export interface GenericTreeNode extends BaseTreeNode {
  // Omit nodeType for unknown kinds to fall back to generic.
  nodeType?: 'generic'
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

export type DomainTreeNode =
  | GenericTreeNode
  | OrganizationRootTreeNode
  | TreasuryTreeNode
  | RoleTreeNode
  | TeamTreeNode
