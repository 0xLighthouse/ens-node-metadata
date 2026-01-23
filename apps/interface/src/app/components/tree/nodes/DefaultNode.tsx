'use client'

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode, TreeNodeType } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { resolveLink } from '@/lib/links'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Link2 } from 'lucide-react'

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

const getAvatarFallback = (address: string) => {
  if (!address || address.length < 4) return '??'
  return address.slice(2, 4).toUpperCase()
}

const truncateAddress = (address: string) => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

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
      width="320px"
    >
      {/* Header with icon and name */}
      <div
        className="flex items-center gap-4 p-4 border-b"
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
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: isSuggested ? '#e2e8f0' : accentColor,
          }}
        >
          {isSuggested ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
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
              width="28"
              height="28"
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
          <div className="text-base font-semibold text-gray-900 truncate">{displayName}</div>
          <div className="text-sm text-gray-500 truncate">{node.name}</div>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isCollapsed && childrenCount > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-md">
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

      {/* Address info bar */}
      {!isSuggested && (
        <>
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Link2 className="size-3.5 flex-shrink-0 text-gray-400" />
                <span className="text-sm text-gray-700 font-mono">
                  {truncateAddress(node.address || '0x0000...0000')}
                </span>
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.label}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex-shrink-0 font-medium"
              >
                View →
              </a>
            </div>
          </div>

          {/* Manager row */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
            <a
              href={`https://etherscan.io/address/${node.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Manager"
              className="flex items-center gap-2 leading-none hover:opacity-70 transition-opacity group"
            >
              <Avatar className="size-4 flex-shrink-0 inline-flex">
                <AvatarImage src={`https://avatar.vercel.sh/${node.owner}`} />
                <AvatarFallback className="text-[8px] font-medium bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                  {getAvatarFallback(node.owner)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-700 font-mono truncate leading-none">
                {truncateAddress(node.owner)}
              </span>
              <ExternalLink className="size-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
            </a>
          </div>
        </>
      )}

      {isSuggested && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500 italic text-center">Click to add subdomain</div>
        </div>
      )}
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
