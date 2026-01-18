'use client'

import { useState } from 'react'
import { useEditStore } from '@/stores/edits'
import { ApplyChangesDialog } from './ApplyChangesDialog'

export function ChangesBar() {
  const { pendingEdits, clearAllEdits } = useEditStore()
  const changesCount = pendingEdits.size
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleApplyChanges = () => {
    // TODO: Apply changes to backend
    console.log('Apply changes:', Array.from(pendingEdits.values()))
    clearAllEdits()
    setIsDialogOpen(false)
  }

  if (changesCount === 0) return null

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg">
        {/* Changes Count */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {changesCount} {changesCount === 1 ? 'Change' : 'Changes'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearAllEdits}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700 transition-colors"
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
