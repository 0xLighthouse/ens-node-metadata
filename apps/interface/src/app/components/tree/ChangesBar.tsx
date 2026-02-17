'use client'

import { useState, useCallback } from 'react'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useMutationsStore } from '@/stores/mutations'
import { useWeb3 } from '@/contexts/Web3Provider'
import { useTreeData } from '@/hooks/useTreeData'
import type { TreeNodes } from '@/lib/tree/types'
import { ApplyChangesDialog } from './ApplyChangesDialog'

export function ChangesBar() {
  const { pendingMutations, clearPendingMutations } = useTreeEditStore()
  const { submitMutations, status: mutationsStatus } = useMutationsStore()
  const { walletClient } = useWeb3()
  const { sourceTree } = useTreeData()

  // Helper to count all nodes including nested children
  const countNodes = (nodes: any[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + (node.children ? countNodes(node.children) : 0)
    }, 0)
  }

  // Count total changes: edits count as 1 each, creations count all nodes recursively
  const changesCount = Array.from(pendingMutations.values()).reduce((count, change) => {
    if (change.isCreate) {
      // Count all nodes being created (including nested children)
      return count + (change.nodes ? countNodes(change.nodes) : 0)
    }
    // Count edits as 1 each
    return count + 1
  }, 0)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const findNode = useCallback(
    (name: string, node: TreeNodes | null = sourceTree): TreeNodes | null => {
      if (!node) return null
      if (node.name === name) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(name, child)
          if (found) return found
        }
      }
      return null
    },
    [sourceTree],
  )

  const handleApplyChanges = async (mutationIds: string[]) => {
    if (!walletClient) return
    await submitMutations({ mutationIds, findNode, walletClient })
    // Close dialog if no mutations remain
    if (useTreeEditStore.getState().pendingMutations.size === 0) {
      setIsDialogOpen(false)
    }
  }

  if (changesCount === 0) return null

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg">
        {/* Changes Count */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {changesCount} {changesCount === 1 ? 'Change' : 'Changes'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearPendingMutations}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsDialogOpen(true)}
            disabled={mutationsStatus === 'executing'}
          >
            {mutationsStatus === 'executing' ? 'Submitting...' : 'Apply Changes'}
          </button>
        </div>
      </div>

      <ApplyChangesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleApplyChanges}
      />
    </>
  )
}
