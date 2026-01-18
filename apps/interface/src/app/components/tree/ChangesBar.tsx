'use client'

import { useState } from 'react'
import { useEditStore } from '@/stores/edits'
import { ApplyChangesDialog } from './ApplyChangesDialog'

export function ChangesBar() {
  const { pendingChanges, clearAllChanges } = useEditStore()

  // Helper to count all nodes including nested children
  const countNodes = (nodes: any[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + (node.children ? countNodes(node.children) : 0)
    }, 0)
  }

  // Count total changes: edits count as 1 each, creations count all nodes recursively
  const changesCount = Array.from(pendingChanges.values()).reduce((count, change) => {
    if (change.isCreate) {
      // Count all nodes being created (including nested children)
      return count + (change.nodes ? countNodes(change.nodes) : 0)
    }
    // Count edits as 1 each
    return count + 1
  }, 0)

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleApplyChanges = () => {
    // TODO: Apply changes to backend
    console.log('Apply changes:', Array.from(pendingChanges.values()))
    clearAllChanges()
    setIsDialogOpen(false)
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
            onClick={clearAllChanges}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors"
            onClick={() => setIsDialogOpen(true)}
          >
            Apply Changes
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
