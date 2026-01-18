'use client'

import { createContext, useContext, useState, useMemo, type ReactNode, type FC } from 'react'
import { useTreeEditStore } from '@/stores/tree-edits'

export interface DomainTreeNode {
  name: string
  children?: DomainTreeNode[]
  // Optional metadata for display
  address?: string
  wearerCount?: number
  maxWearers?: number
  icon?: string
  color?: string
  // Additional fields (will be refactored to BaseNode, TreasuryNode, etc later)
  title?: string // String(255)
  kind?: string // String(255) - e.g., Safe, EOA, Role, Team, etc
  description?: string // Text(Markdown) - human-readable explanation
  // Suggested nodes are placeholders for sparse trees
  isSuggested?: boolean
  // Pending creation nodes
  isPendingCreation?: boolean
}

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
  wearerCount: 1,
  maxWearers: 1,
  color: '#ef4444',
  children: [
    {
      name: 'app.ens.eth',
      address: '0x83e3...c360',
      wearerCount: 1,
      maxWearers: 1,
      color: '#3b82f6',
      children: [
        {
          name: 'beta.app.ens.eth',
          address: '0xbc1e...62f9',
          wearerCount: 1,
          maxWearers: 8,
          color: '#ec4899',
        },
        {
          name: 'staging.app.ens.eth',
          address: '0xde4f...82a1',
          wearerCount: 0,
          maxWearers: 5,
          color: '#8b5cf6',
        },
      ],
    },
    {
      name: 'docs.ens.eth',
      address: '0x94a2...1b3c',
      wearerCount: 0,
      maxWearers: 3,
      color: '#10b981',
      children: [
        {
          name: 'api.docs.ens.eth',
          address: '0x7c8d...4e5f',
          wearerCount: 2,
          maxWearers: 5,
          color: '#06b6d4',
        },
        {
          name: 'guides.docs.ens.eth',
          address: '0x2f1a...9d8c',
          wearerCount: 1,
          maxWearers: 3,
          color: '#14b8a6',
        },
      ],
    },
    {
      name: 'wallet.ens.eth',
      address: '0x5e9c...3a7b',
      wearerCount: 3,
      maxWearers: 10,
      color: '#f59e0b',
      children: [
        {
          name: 'mobile.wallet.ens.eth',
          address: '0xa1b2...c4d5',
          wearerCount: 5,
          maxWearers: 10,
          color: '#eab308',
        },
        {
          name: 'web.wallet.ens.eth',
          address: '0x6d7e...8f9a',
          wearerCount: 2,
          maxWearers: 10,
          color: '#f97316',
        },
      ],
    },
    {
      name: 'dao.ens.eth',
      address: '0x3c4d...5e6f',
      wearerCount: 0,
      maxWearers: 1,
      color: '#6366f1',
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
