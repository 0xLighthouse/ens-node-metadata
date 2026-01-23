'use client'

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { UserCheck } from 'lucide-react'

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

  return (
    <NodeContainer
      className={`
        cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        ${isSuggested ? 'opacity-50' : ''}
      `}
      style={{
        width: '320px',
        backgroundColor: isSuggested
          ? '#f8fafc'
          : isPendingCreation
            ? '#eef2ff'
            : hasPendingEdits
              ? '#e0e7ff'
              : 'white',
        border: isSuggested
          ? '2px dashed #cbd5e1'
          : isPendingCreation
            ? '2px dashed #6366f1'
            : hasPendingEdits
              ? '2px dashed #818cf8'
              : '1px solid #c7d2fe',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 4px 12px rgba(99, 102, 241, 0.3)'
          : isPendingCreation
            ? '0 4px 12px rgba(99, 102, 241, 0.25)'
            : hasPendingEdits
              ? '0 4px 12px rgba(129, 140, 248, 0.25)'
              : '0 2px 8px rgba(99, 102, 241, 0.15)',
      }}
    >
      {/* Header with icon and name */}
      <div
        className="flex items-center gap-3 p-4 border-b"
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
            <div className="text-base font-bold text-gray-900 truncate">
              {ensName || displayName}
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded">
              SIGNER
            </span>
            {(node as any).isComputed && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded border border-gray-300">
                AUTO
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {ensName ? node.name : node.name}
          </div>
        </div>
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
        {isSuggested ? (
          <div className="flex items-center gap-2 text-gray-500 text-xs italic">
            Click to add signer
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs truncate">{node.address || '0x0000...0000'}</span>
          </div>
        )}
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
