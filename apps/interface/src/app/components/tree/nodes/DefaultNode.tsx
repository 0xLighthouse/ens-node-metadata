'use client'

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode, TreeNodeType } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { resolveLink } from '@/lib/links'

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

interface DomainTreeNodeProps {
  node: TreeNode
  isSelected: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  hasPendingEdits?: boolean
  onToggleCollapse?: () => void
  childrenCount?: number
}

const nodeTypeAccent: Record<TreeNodeType, string> = {
  default: '#94a3b8',
  organizationRoot: '#0ea5e9',
  treasury: '#f59e0b',
  role: '#8b5cf6',
  team: '#10b981',
}

const getNodeAccent = (nodeType?: TreeNodeType) =>
  nodeType ? nodeTypeAccent[nodeType] : nodeTypeAccent.default

const DefaultNodeCard = ({
  node,
  isSelected,
  hasChildren = false,
  isCollapsed = false,
  hasPendingEdits = false,
  onToggleCollapse,
  childrenCount = 0,
}: DomainTreeNodeProps) => {
  const displayName = node.name.split('.')[0]

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse?.()
  }

  const accentColor = getNodeAccent(node.nodeType)

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
        className="flex items-center gap-3 p-3 border-b"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#f0fdf4'
              : hasPendingEdits
                ? '#fff7ed'
                : 'white',
          borderBottomColor: isSuggested
            ? '#e2e8f0'
            : isPendingCreation
              ? '#bbf7d0'
              : hasPendingEdits
                ? '#fed7aa'
                : '#e5e7eb',
        }}
      >
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: isSuggested ? '#e2e8f0' : accentColor,
          }}
        >
          {isSuggested ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
          <div className="text-xs text-gray-500 truncate">{node.name}</div>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isCollapsed && childrenCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                +{childrenCount}
              </span>
            )}
            <button
              onClick={handleToggleCollapse}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              title={isCollapsed ? 'Expand children' : 'Collapse children'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Address info */}
      <div
        className="px-3 py-2 flex items-center justify-between text-sm"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#dcfce7'
              : hasPendingEdits
                ? '#ffedd5'
                : `${accentColor}20`,
        }}
      >
        {isSuggested ? (
          <div className="flex items-center gap-2 text-gray-500 text-xs italic">
            Click to add subdomain
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.label}
                className="font-mono text-xs truncate hover:underline"
              >
                {node.address || '0x0000...0000'}
              </a>
            </div>
          </>
        )}
      </div>
    </NodeContainer>
  )
}

// Wrapper component for React Flow
const DefaultNodeWrapper = ({ data }: NodeProps<DomainTreeNodeData>) => {
  return (
    <DefaultNodeCard
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

export const DefaultNode = memo(DefaultNodeWrapper)
