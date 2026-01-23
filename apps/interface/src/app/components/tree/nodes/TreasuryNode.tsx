'use client'

import { memo, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { DollarSign, Plus, Lock, ChevronUp, Search, Loader2 } from 'lucide-react'

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

interface TreasuryNodeProps {
  node: TreeNode
  isSelected: boolean
  hasChildren?: boolean
  isCollapsed?: boolean
  hasPendingEdits?: boolean
  onToggleCollapse?: () => void
  childrenCount?: number
}

const TreasuryNodeCard = ({
  node,
  isSelected,
  hasChildren = false,
  isCollapsed = false,
  hasPendingEdits = false,
  onToggleCollapse,
  childrenCount = 0,
}: TreasuryNodeProps) => {
  const displayName = node.name.split('.')[0]
  const [isInspecting, setIsInspecting] = useState(false)
  const { upsertEdit } = useTreeEditStore()
  const { triggerLayout } = useTreeControlsStore()

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse?.()
  }

  const handleInspect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsInspecting(true)

    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node }),
      })

      if (!response.ok) {
        throw new Error('Failed to inspect node')
      }

      const result = await response.json()

      // Create computed signer nodes if Safe multisig detected
      let computedChildren: any[] | undefined
      if (result.detectedType === 'Safe Multisig' && result.metadata?.signers) {
        computedChildren = result.metadata.signers.map((signer: any, index: number) => ({
          name: `signer-${index + 1}.${node.name}`,
          address: signer.address as `0x${string}`,
          owner: signer.address as `0x${string}`,
          subdomainCount: 0,
          type: 'Signer',
          title: signer.ensName || `Signer ${index + 1}`,
          description: 'Safe multisig signer',
          ensName: signer.ensName,
          ensAvatar: signer.ensAvatar,
          isComputed: true,
        }))
      }

      // Update node with inspection data and computed children
      upsertEdit(node.name, {
        inspectionData: {
          detectedType: result.detectedType,
          metadata: result.metadata,
          inspectedAt: new Date().toISOString(),
          computedChildren,
        },
      })

      // Trigger layout recompute if computed children were added
      if (computedChildren && computedChildren.length > 0) {
        // Delay to allow preview tree to update first
        setTimeout(() => {
          triggerLayout()
        }, 100)
      }
    } catch (error) {
      console.error('Error inspecting node:', error)
    } finally {
      setIsInspecting(false)
    }
  }

  const accentColor = '#f59e0b' // amber for treasury

  const isSuggested = node.isSuggested || false
  const isPendingCreation = node.isPendingCreation || false

  return (
    <NodeContainer
      className={`
        relative
        cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2' : ''}
        ${isCollapsed && hasChildren && !isSelected && !hasPendingEdits && !isPendingCreation ? 'ring-2 ring-amber-200' : ''}
        ${isSuggested ? 'opacity-50' : ''}
      `}
      style={{
        width: '560px',
        backgroundColor: isSuggested
          ? '#f8fafc'
          : isPendingCreation
            ? '#fffbeb'
            : hasPendingEdits
              ? '#fff7ed'
              : 'white',
        border: isSuggested
          ? '2px dashed #cbd5e1'
          : isPendingCreation
            ? '2px dashed #f59e0b'
            : hasPendingEdits
              ? '2px dashed #fb923c'
              : '1px solid #fde68a',
        borderRadius: '8px',
        overflow: 'visible',
        boxShadow: isSelected
          ? '0 4px 12px rgba(245, 158, 11, 0.3)'
          : isPendingCreation
            ? '0 4px 12px rgba(245, 158, 11, 0.25)'
            : hasPendingEdits
              ? '0 4px 12px rgba(249, 115, 22, 0.25)'
              : '0 2px 8px rgba(245, 158, 11, 0.15)',
      }}
    >
      {/* Header with icon and name */}
      <div
        className="flex items-center gap-4 p-6 border-b"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#fffbeb'
              : hasPendingEdits
                ? '#fff7ed'
                : 'white',
          borderBottomColor: isSuggested
            ? '#e2e8f0'
            : isPendingCreation
              ? '#fde68a'
              : hasPendingEdits
                ? '#fed7aa'
                : '#fde68a',
        }}
      >
        <div
          className="flex items-center justify-center rounded-md flex-shrink-0"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: isSuggested ? '#e2e8f0' : accentColor,
          }}
        >
          {isSuggested ? (
            <Plus size={48} color="#64748b" strokeWidth={2} />
          ) : (
            <DollarSign size={48} color="white" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900 truncate">{displayName}</div>
            <span className="px-3 py-1 text-sm font-bold bg-amber-100 text-amber-800 rounded">
              TREASURY
            </span>
          </div>
          <div className="text-base text-gray-500 truncate mt-1">{node.name}</div>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCollapsed && childrenCount > 0 && (
              <span className="px-3 py-1 text-sm font-semibold bg-amber-100 text-amber-700 rounded-full">
                +{childrenCount}
              </span>
            )}
            <button
              onClick={handleToggleCollapse}
              className="p-2 rounded hover:bg-amber-50 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              title={isCollapsed ? 'Expand children' : 'Collapse children'}
            >
              <ChevronUp
                size={32}
                className={`transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Address info */}
      <div
        className="px-6 py-4 flex items-center justify-between text-base"
        style={{
          backgroundColor: isSuggested
            ? '#f8fafc'
            : isPendingCreation
              ? '#fef3c7'
              : hasPendingEdits
                ? '#ffedd5'
                : '#fef3c7',
        }}
      >
        {isSuggested ? (
          <div className="flex items-center gap-2 text-gray-500 text-xs italic">
            Click to add treasury
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <Lock size={20} className="flex-shrink-0" />
              <span className="font-mono text-sm truncate">{node.address || '0x0000...0000'}</span>
            </div>
          </>
        )}
      </div>

      {/* Inspection Results */}
      {!isSuggested && node.inspectionData && (
        <div className="px-6 py-4 border-t border-amber-200 bg-amber-50">
          <div className="space-y-2">
            {/* Detected Type */}
            {node.inspectionData.detectedType && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-amber-900">Type:</span>
                <span className="text-sm text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {node.inspectionData.detectedType}
                </span>
              </div>
            )}

            {/* Metadata */}
            {node.inspectionData.metadata && Object.keys(node.inspectionData.metadata).length > 0 && (
              <div className="space-y-1">
                {node.inspectionData.metadata.thresholdRatio && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-900">Threshold:</span>
                    <span className="text-sm text-amber-800 font-mono">
                      {node.inspectionData.metadata.thresholdRatio}
                    </span>
                  </div>
                )}
                {node.inspectionData.metadata.signerCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-900">Signers:</span>
                    <span className="text-sm text-amber-800">
                      {node.inspectionData.metadata.signerCount}
                    </span>
                  </div>
                )}
                {node.inspectionData.metadata.note && (
                  <div className="text-xs text-amber-700 italic">
                    {node.inspectionData.metadata.note}
                  </div>
                )}
              </div>
            )}

            {/* Inspected timestamp */}
            {node.inspectionData.inspectedAt && (
              <div className="text-xs text-amber-600 pt-1">
                Inspected: {new Date(node.inspectionData.inspectedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Button - Positioned at bottom center edge */}
      {!isSuggested && (
        <button
          onClick={handleInspect}
          disabled={isInspecting}
          className="absolute left-1/2 -translate-x-1/2 -bottom-6 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10"
          aria-label="Inspect contract"
          title="Detect contract type and metadata"
          style={{
            border: '3px solid white',
          }}
        >
          {isInspecting ? (
            <Loader2 size={24} color="white" className="animate-spin" />
          ) : (
            <Search size={24} color="white" />
          )}
        </button>
      )}
    </NodeContainer>
  )
}

// Wrapper component for React Flow
const TreasuryNodeWrapper = ({ data }: NodeProps<DomainTreeNodeData>) => {
  return (
    <TreasuryNodeCard
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

export const TreasuryNode = memo(TreasuryNodeWrapper)
