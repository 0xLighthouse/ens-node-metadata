'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEditStore } from '@/stores/edits'
import { useDomainTree } from '@/contexts/DomainTreeContext'
import type { NodeEdit } from '@/stores/edits'

interface ApplyChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ApplyChangesDialog({ open, onOpenChange, onConfirm }: ApplyChangesDialogProps) {
  const { pendingEdits } = useEditStore()
  const { tree } = useDomainTree()

  // Find the original node data
  const findNode = (name: string, node = tree): any => {
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(name, child)
        if (found) return found
      }
    }
    return null
  }

  const editsArray = Array.from(pendingEdits.values())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply Changes</DialogTitle>
          <DialogDescription>
            Review the changes you're about to apply to {editsArray.length}{' '}
            {editsArray.length === 1 ? 'node' : 'nodes'}.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {editsArray.map((edit) => {
            const originalNode = findNode(edit.nodeName)
            return (
              <div
                key={edit.nodeName}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                {/* Node name header */}
                <div className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {edit.nodeName}
                </div>

                {/* Changes list */}
                <div className="space-y-2 text-sm">
                  {/* Address change */}
                  {edit.address !== undefined && edit.address !== originalNode?.address && (
                    <div className="grid grid-cols-[120px,1fr] gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Address:</span>
                      <div className="font-mono">
                        <div className="text-red-600 dark:text-red-400 line-through">
                          {originalNode?.address || '(empty)'}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {edit.address || '(empty)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wearer count change */}
                  {edit.wearerCount !== undefined &&
                    edit.wearerCount !== originalNode?.wearerCount && (
                      <div className="grid grid-cols-[120px,1fr] gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Wearer Count:</span>
                        <div>
                          <span className="text-red-600 dark:text-red-400 line-through mr-2">
                            {originalNode?.wearerCount ?? 0}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {edit.wearerCount}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Max wearers change */}
                  {edit.maxWearers !== undefined &&
                    edit.maxWearers !== originalNode?.maxWearers && (
                      <div className="grid grid-cols-[120px,1fr] gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Max Wearers:</span>
                        <div>
                          <span className="text-red-600 dark:text-red-400 line-through mr-2">
                            {originalNode?.maxWearers ?? 1}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {edit.maxWearers}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Color change */}
                  {edit.color !== undefined && edit.color !== originalNode?.color && (
                    <div className="grid grid-cols-[120px,1fr] gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Color:</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 line-through">
                          <span
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: originalNode?.color ?? '#94a3b8' }}
                          />
                          <span className="font-mono text-xs">
                            {originalNode?.color ?? '#94a3b8'}
                          </span>
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <span
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: edit.color }}
                          />
                          <span className="font-mono text-xs">{edit.color}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Apply {editsArray.length} {editsArray.length === 1 ? 'Change' : 'Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
