'use client'

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { UserCheck, Sparkles } from 'lucide-react'
import { shortAddress } from '@/lib/utils'
import { resolveLink } from '@/lib/links'
import { ExternalActionButton } from './ExternalActionButton'

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

interface SignerNodeProps {
  node: TreeNode
  isSelected: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  hasPendingEdits?: boolean
  onToggleCollapse?: () => void
  childrenCount?: number
}

const SignerNodeCard = ({
  node,
  isSelected,
  hasChildren = false,
  isCollapsed = false,
  hasPendingEdits = false,
  onToggleCollapse,
  childrenCount = 0,
}: SignerNodeProps) => {
  const displayName = node.name.split('.')[0]
  const ensName = (node as any).ensName
  const ensAvatar = (node as any).ensAvatar

  const accentColor = '#6366f1' // indigo for signers

  const isSuggested = node.isSuggested || false
  const isPendingCreation = node.isPendingCreation || false

  // Resolve the appropriate link for this node
  const link = resolveLink(node)

  return (
    <NodeContainer
      isSelected={isSelected}
      isPendingCreation={isPendingCreation}
      hasPendingEdits={hasPendingEdits}
      isSuggested={isSuggested}
      isCollapsed={isCollapsed}
      hasChildren={hasChildren}
      accentColor={accentColor}
    >
      {/* Header with icon and name */}
      <div
        className="relative flex items-center gap-3 p-4 border-b"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#eef2ff'
              : hasPendingEdits
                ? '#e0e7ff'
                : 'white',
          borderBottomColor: isSuggested
            ? '#e2e8f0'
            : isPendingCreation
              ? '#c7d2fe'
              : hasPendingEdits
                ? '#a5b4fc'
                : '#c7d2fe',
        }}
      >
        {ensAvatar ? (
          <div className="flex items-center justify-center rounded-md flex-shrink-0 overflow-hidden">
            <img
              src={ensAvatar}
              alt={ensName || 'Signer avatar'}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-md flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: isSuggested ? '#e2e8f0' : accentColor,
            }}
          >
            <UserCheck size={24} color={isSuggested ? '#64748b' : 'white'} strokeWidth={2} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded">
              SIGNER
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{shortAddress(node.address)}</div>
        </div>
        {(node as any).isComputed && (
          <div
            className="absolute top-4 right-4"
            title="Auto-detected signer"
          >
            <Sparkles size={16} className="text-indigo-400" />
          </div>
        )}
      </div>

      {/* Address info */}
      <div
        className="px-4 py-3 text-sm"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#ddd6fe'
              : hasPendingEdits
                ? '#ddd6fe'
                : '#ddd6fe',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs truncate flex items-center gap-1.5">
            <span className="truncate">{ensName || displayName}</span>
            <ExternalActionButton
              url={link.url}
              label={`${link.label} (new tab)`}
              className="hover:bg-indigo-200"
            />
          </span>
        </div>
      </div>
    </NodeContainer>
  )
}

// Wrapper component for React Flow
const SignerNodeWrapper = ({ data }: NodeProps<DomainTreeNodeData>) => {
  return (
    <SignerNodeCard
      node={data.node}
      isSelected={data.isSelected}
      hasChildren={data.hasChildren}
      isCollapsed={data.isCollapsed}
      hasPendingEdits={data.hasPendingEdits}
      onToggleCollapse={data.onToggleCollapse}
      childrenCount={data.childrenCount}
    />
  )
}

export const SignerNode = memo(SignerNodeWrapper)
