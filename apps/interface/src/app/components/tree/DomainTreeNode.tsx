'use client'

import { memo } from 'react'
import type { DomainTreeNode } from '@/contexts/DomainTreeContext'

interface DomainTreeNodeProps {
  node: DomainTreeNode
  isSelected: boolean
  onClick: () => void
  isCompact?: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  hasPendingEdits?: boolean
  onToggleCollapse?: () => void
  childrenCount?: number
}

const DomainTreeNodeCardComponent = ({
  node,
  isSelected,
  onClick,
  isCompact = false,
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

  const isSuggested = node.isSuggested || false

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
        ${isCollapsed && hasChildren && !isSelected && !hasPendingEdits ? 'ring-2 ring-indigo-200' : ''}
        ${isSuggested ? 'opacity-50' : ''}
      `}
      style={{
        width: isCompact ? '200px' : '280px',
        backgroundColor: isSuggested
          ? '#f8fafc'
          : hasPendingEdits
          ? '#fff7ed'
          : 'white',
        border: isSuggested
          ? '2px dashed #cbd5e1'
          : hasPendingEdits
          ? '2px dashed #fb923c'
          : '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
          : hasPendingEdits
          ? '0 4px 12px rgba(249, 115, 22, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header with icon and name */}
      <div
        className="flex items-center gap-3 p-3 border-b"
        style={{
          backgroundColor: isSuggested ? '#f8fafc' : hasPendingEdits ? '#fff7ed' : 'white',
          borderBottomColor: isSuggested ? '#e2e8f0' : hasPendingEdits ? '#fed7aa' : '#e5e7eb',
        }}
      >
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: isSuggested ? '#e2e8f0' : node.color || '#94a3b8',
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
          {!isCompact && (
            <div className="text-xs text-gray-500 truncate">{node.name}</div>
          )}
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

      {/* Address and wearer info */}
      <div
        className="px-3 py-2 flex items-center justify-between text-sm"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : hasPendingEdits
            ? '#ffedd5'
            : (node.color ? `${node.color}20` : '#f1f5f9'),
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
              <span className="font-mono text-xs truncate">
                {node.address || '0x0000...0000'}
              </span>
            </div>
            {node.wearerCount !== undefined && node.maxWearers !== undefined && (
              <div className="text-xs font-medium text-gray-600 flex-shrink-0">
                {node.wearerCount} of {node.maxWearers}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const DomainTreeNodeCard = memo(DomainTreeNodeCardComponent)
