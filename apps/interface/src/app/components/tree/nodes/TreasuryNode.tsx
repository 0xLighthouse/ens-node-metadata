'use client'

import { memo, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeData } from '@/hooks/useTreeData'
import { findNodeByAddress, findAllNodesByAddress } from '@/lib/tree/utils'
import { resolveLink } from '@/lib/links'
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
  const { previewTree } = useTreeData()

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
      let computedReferences: string[] | undefined

      if (result.detectedType === 'Safe Multisig' && result.metadata?.signers) {
        const newChildren: any[] = []
        const existingRefs: string[] = []

        for (const [index, signer] of result.metadata.signers.entries()) {
          const signerAddress = signer.address as `0x${string}`

          // Check if a Signer node with this address already exists in the tree
          const existingNodes = findAllNodesByAddress(previewTree, signerAddress)
          const existingSignerNode = existingNodes.find((n) => (n as any).type === 'Signer')

          if (existingSignerNode) {
            // A Signer node with this address exists - create a reference edge
            existingRefs.push(existingSignerNode.name)
          } else {
            // No Signer node with this address - create a new Signer node
            // (even if address exists as a different node type)
            newChildren.push({
              name: `signer-${index + 1}.${node.name}`,
              address: signerAddress,
              owner: signerAddress,
              subdomainCount: 0,
              type: 'Signer',
              title: signer.ensName || `Signer ${index + 1}`,
              description: 'Safe multisig signer',
              ensName: signer.ensName,
              ensAvatar: signer.ensAvatar,
              isComputed: true,
            })
          }
        }

        computedChildren = newChildren.length > 0 ? newChildren : undefined
        computedReferences = existingRefs.length > 0 ? existingRefs : undefined
      }

      // Update node with inspection data and computed children/references
      upsertEdit(node.name, {
        inspectionData: {
          detectedType: result.detectedType,
          metadata: result.metadata,
          inspectedAt: new Date().toISOString(),
          computedChildren,
          computedReferences,
        },
      })

      // Trigger layout recompute if computed children or references were added
      if ((computedChildren && computedChildren.length > 0) || (computedReferences && computedReferences.length > 0)) {
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
      overflow="visible"
    >
      {/* Header with icon and name */}
      <div
        className="flex items-center gap-3 p-3 border-b"
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
            width: '40px',
            height: '40px',
            backgroundColor: isSuggested ? '#e2e8f0' : accentColor,
          }}
        >
          {isSuggested ? (
            <Plus size={24} color="#64748b" strokeWidth={2} />
          ) : (
            <DollarSign size={24} color="white" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-900 truncate">{displayName}</div>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded">
              TREASURY
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">{node.name}</div>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isCollapsed && childrenCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                +{childrenCount}
              </span>
            )}
            <button
              onClick={handleToggleCollapse}
              className="p-1 rounded hover:bg-amber-50 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
              title={isCollapsed ? 'Expand children' : 'Collapse children'}
            >
              <ChevronUp
                size={20}
                className={`transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              />
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
            <div className="flex items-center gap-2 min-w-0">
              <Lock size={14} className="flex-shrink-0" />
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


      {/* Inspect Button - Positioned at bottom center edge */}
      {!isSuggested && (
        <button
          onClick={handleInspect}
          disabled={isInspecting}
          className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10"
          aria-label="Inspect contract"
          title="Detect contract type and metadata"
          style={{
            border: '2px solid white',
          }}
        >
          {isInspecting ? (
            <Loader2 size={16} color="white" className="animate-spin" />
          ) : (
            <Search size={16} color="white" />
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
