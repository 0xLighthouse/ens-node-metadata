'use client'

import { createContext, useContext, useState, useMemo, type ReactNode, type FC } from 'react'
import { useTreeEditStore } from '@/stores/tree-edits'

export type TreeNodeType = 'generic' | 'organizationRoot' | 'treasury' | 'role' | 'team'

interface BaseTreeNode {
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

interface TreeDataContextType {
  previewTree: DomainTreeNode
  sourceTree: DomainTreeNode
  addNodesToParent: (parentName: string, newNodes: DomainTreeNode[]) => void
}

const TreeDataContext = createContext<TreeDataContextType | undefined>(undefined)

// Hardcoded sample tree for testing d3 rendering
const sampleTree: DomainTreeNode = {
  name: 'ens.eth',
  address: '0x0eb5...7576',
  children: [
    {
      name: 'app.ens.eth',
      address: '0x83e3...c360',
      children: [
        {
          name: 'beta.app.ens.eth',
          address: '0xbc1e...62f9',
        },
        {
          name: 'staging.app.ens.eth',
          address: '0xde4f...82a1',
        },
      ],
    },
    {
      name: 'docs.ens.eth',
      address: '0x94a2...1b3c',
      children: [
        {
          name: 'api.docs.ens.eth',
          address: '0x7c8d...4e5f',
        },
        {
          name: 'guides.docs.ens.eth',
          address: '0x2f1a...9d8c',
        },
      ],
    },
    {
      name: 'wallet.ens.eth',
      address: '0x5e9c...3a7b',
      children: [
        {
          name: 'mobile.wallet.ens.eth',
          address: '0xa1b2...c4d5',
        },
        {
          name: 'web.wallet.ens.eth',
          address: '0x6d7e...8f9a',
        },
      ],
    },
    {
      name: 'dao.ens.eth',
      address: '0x3c4d...5e6f',
    },
  ],
}

export const TreeDataProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [sourceTree, setSourceTree] = useState<DomainTreeNode>(sampleTree)
  const { pendingMutations } = useTreeEditStore()

  // Merge pending creations into the tree for visualization
  const previewTree = useMemo(() => {
    const mergePendingCreations = (node: DomainTreeNode): DomainTreeNode => {
      // Find any pending creations for this node
      const creationsForThisNode = Array.from(pendingMutations.values()).filter(
        (change) => change.isCreate && change.parentName === node.name,
      )

      // Collect all nodes to add from creations
      const nodesToAdd: DomainTreeNode[] = []
      for (const creation of creationsForThisNode) {
        if (creation.nodes) {
          const markedNodes = creation.nodes.map((n) => ({
            ...n,
            isPendingCreation: true,
            // Recursively mark children as pending too
            children: n.children?.map(markAsPending),
          }))
          nodesToAdd.push(...markedNodes)
        }
      }

      // Recursively process existing children
      const processedChildren = node.children?.map(mergePendingCreations) || []

      // Combine existing children with new pending nodes
      const allChildren = [...processedChildren, ...nodesToAdd]

      return {
        ...node,
        children: allChildren.length > 0 ? allChildren : undefined,
      }
    }

    const markAsPending = (node: DomainTreeNode): DomainTreeNode => ({
      ...node,
      isPendingCreation: true,
      children: node.children?.map(markAsPending),
    })

    return mergePendingCreations(sourceTree)
  }, [sourceTree, pendingMutations])

  const addNodesToParent = (parentName: string, newNodes: DomainTreeNode[]) => {
    const addNodes = (node: DomainTreeNode): DomainTreeNode => {
      if (node.name === parentName) {
        return {
          ...node,
          children: [...(node.children || []), ...newNodes],
        }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addNodes),
        }
      }
      return node
    }
    setSourceTree((prevTree) => addNodes(prevTree))
  }

  return (
    <TreeDataContext.Provider value={{ previewTree, sourceTree, addNodesToParent }}>
      {children}
    </TreeDataContext.Provider>
  )
}

export const useTreeData = (): TreeDataContextType => {
  const context = useContext(TreeDataContext)
  if (!context) {
    throw new Error('useTreeData must be used within a TreeDataProvider')
  }
  return context
}
