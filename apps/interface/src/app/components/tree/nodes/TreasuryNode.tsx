'use client'

import { memo, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TreeNode } from '@/lib/tree/types'
import { NodeContainer } from './NodeContainer'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeData } from '@/hooks/useTreeData'
import { findAllNodesByAddress } from '@/lib/tree/utils'
import { resolveLink } from '@/lib/links'
import { DollarSign, Plus, Lock, ChevronUp, Search, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NodeIcon } from './NodeIcon'
import { ExternalActionButton } from './ExternalActionButton'

const getAvatarFallback = (address: string) => {
  if (!address || address.length < 4) return '??'
  return address.slice(2, 4).toUpperCase()
}

const truncateAddress = (address: string) => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

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
  const treeLink = resolveLink(node)
  const addressUrl = node.address ? `https://etherscan.io/address/${node.address}` : null
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

  const stopNodeInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const accentColor = '#f59e0b' // amber for treasury

  const isSuggested = node.isSuggested || false
  const isPendingCreation = node.isPendingCreation || false

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
        <NodeIcon
          avatarUrl={node.attributes?.avatar}
          fallback={<DollarSign size={28} color="white" strokeWidth={2} />}
          accentColor={accentColor}
          size={48}
          isSuggested={isSuggested}
        />
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-900 truncate text-left flex items-center gap-2">
            {displayName}
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded flex-shrink-0">
              TREASURY
            </span>
          </div>
          <div className="text-sm text-blue-700 truncate flex items-center gap-1.5">
            <span className="truncate">{node.name}</span>
            <ExternalActionButton
              url={`https://app.ens.domains/${node.name}`}
              label={`Open ${node.name} in ENS app (new tab)`}
              className="hover:bg-blue-100"
            />
          </div>
        </div>
        {hasChildren && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isCollapsed && childrenCount > 0 && (
              <span className="px-2 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-md">
                +{childrenCount}
              </span>
            )}
            <button
              type="button"
              onMouseDown={stopNodeInteraction}
              onClick={handleToggleCollapse}
              className="nodrag nopan p-1 rounded hover:bg-gray-100 transition-colors"
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

      {/* Address info bar */}
      {!isSuggested && (
        <>
          <div className="px-4 py-3 border-b border-gray-100 text-left">
            {node.address ? (
              <div className="text-sm text-gray-700 font-mono truncate flex items-center gap-1.5">
                <span className="truncate">{truncateAddress(node.address)}</span>
                {addressUrl && (
                  <ExternalActionButton
                    url={addressUrl}
                    label="Open node address in Etherscan (new tab)"
                    className="hover:bg-blue-100 hover:text-blue-700"
                  />
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500 uppercase tracking-wide">No address set</span>
            )}
          </div>

          {/* Manager row */}
          <div className="px-4 py-2.5 bg-gray-50/50">
            <div className="flex items-center gap-2 leading-none">
              <Avatar className="size-4 flex-shrink-0 inline-flex">
                <AvatarImage src={node.ownerEnsAvatar || `https://avatar.vercel.sh/${node.owner}`} />
                <AvatarFallback className="text-[8px] font-medium bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                  {getAvatarFallback(node.owner)}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-sm text-gray-700 truncate leading-none"
                style={{ fontFamily: node.ownerEnsName ? 'inherit' : 'monospace' }}
              >
                {node.ownerEnsName || truncateAddress(node.owner)}
              </span>
              <ExternalActionButton
                url={`https://etherscan.io/address/${node.owner}`}
                label="Manager on Etherscan (new tab)"
                className="hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              />
            </div>
          </div>
        </>
      )}

      {isSuggested && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500 italic text-center">Click to add treasury</div>
        </div>
      )}

      {/* Inspect Button - Positioned at bottom center edge */}
      {!isSuggested && (
        <button
          type="button"
          onMouseDown={stopNodeInteraction}
          onClick={handleInspect}
          disabled={isInspecting}
          className="nodrag nopan absolute left-1/2 -translate-x-1/2 -bottom-4 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10"
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
