'use client'

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode, TreeNodeType } from '@/lib/tree/types'
import { BaseNodeCard } from './BaseNode'

interface DomainTreeNodeData {
  node: TreeNode
  isSelected: boolean
  hasChildren: boolean
  isCollapsed: boolean
  hasPendingEdits: boolean
  childrenCount: number
  orientation: 'vertical' | 'horizontal'
  onToggleCollapse: () => void
}

// Backward-compat accent colors for legacy nodeType values (when no schema type is set)
const legacyAccent: Partial<Record<TreeNodeType, string>> = {
  organizationRoot: '#0ea5e9',
  role: '#8b5cf6',
  team: '#10b981',
}

const DefaultNodeWrapper = ({ data }: NodeProps<DomainTreeNodeData>) => {
  const schemaType = (data.node as any).type as string | undefined
  const configOverride = !schemaType && data.node.nodeType
    ? { accentColor: legacyAccent[data.node.nodeType] ?? '#94a3b8' }
    : undefined

  return (
    <BaseNodeCard
      node={data.node}
      isSelected={data.isSelected}
      hasChildren={data.hasChildren}
      isCollapsed={data.isCollapsed}
      hasPendingEdits={data.hasPendingEdits}
      onToggleCollapse={data.onToggleCollapse}
      childrenCount={data.childrenCount}
      configOverride={configOverride}
    />
  )
}

export const DefaultNode = memo(DefaultNodeWrapper)
