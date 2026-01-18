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

interface ApplyChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ApplyChangesDialog({ open, onOpenChange, onConfirm }: ApplyChangesDialogProps) {
  const { pendingChanges } = useEditStore()
  const { baseTree } = useDomainTree()

  // Find the original node data
  const findNode = (name: string, node = baseTree): any => {
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(name, child)
        if (found) return found
      }
    }
    return null
  }

  const changesArray = Array.from(pendingChanges.values())

  // Helper to count all nodes including nested children
  const countNodes = (nodes: any[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + (node.children ? countNodes(node.children) : 0)
    }, 0)
  }

  // Count total changes: edits count as 1 each, creations count all nodes recursively
  const totalChangesCount = changesArray.reduce((count, change) => {
    if (change.isCreate) {
      return count + (change.nodes ? countNodes(change.nodes) : 0)
    }
    return count + 1
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply Changes</DialogTitle>
          <DialogDescription>
            Review the changes you're about to apply: {totalChangesCount}{' '}
            {totalChangesCount === 1 ? 'change' : 'changes'}.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {changesArray.map((change) => {
            if (change.isCreate) {
              // Helper to render node and its children recursively
              const renderNodeTree = (nodes: any[], depth = 0) => {
                return nodes.map((node, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* Node name and attributes */}
                    <div className={`${depth > 0 ? 'ml-6' : ''}`}>
                      <div className="text-green-700 dark:text-green-300 flex items-start gap-2">
                        <span className="mt-1">+</span>
                        <div className="flex-1">
                          <div className="font-mono font-semibold">{node.name}</div>
                          {/* Attributes */}
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                            {node.title && (
                              <div>Title: {node.title}</div>
                            )}
                            {node.kind && (
                              <div>Kind: {node.kind}</div>
                            )}
                            {node.description && (
                              <div>Description: {node.description}</div>
                            )}
                            {node.color && (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded border border-gray-300" style={{ backgroundColor: node.color }}></span>
                                <span>Color: {node.color}</span>
                              </div>
                            )}
                            {node.wearerCount !== undefined && (
                              <div>Wearer Count: {node.wearerCount}</div>
                            )}
                            {node.maxWearers !== undefined && (
                              <div>Max Wearers: {node.maxWearers}</div>
                            )}
                            {node.address && (
                              <div>Address: {node.address}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Render children recursively */}
                    {node.children && node.children.length > 0 && (
                      <div className="ml-4">
                        {renderNodeTree(node.children, depth + 1)}
                      </div>
                    )}
                  </div>
                ))
              }

              // Render creation
              return (
                <div
                  key={change.id}
                  className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-950"
                >
                  {/* Node creation header */}
                  <div className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Create {change.nodes ? countNodes(change.nodes) : 0} new {countNodes(change.nodes || []) === 1 ? 'node' : 'nodes'} under {change.parentName}
                  </div>

                  {/* List of nodes being created with attributes */}
                  <div className="space-y-3 text-sm ml-4">
                    {change.nodes && renderNodeTree(change.nodes)}
                  </div>
                </div>
              )
            }

            // Render edit
            const originalNode = change.nodeName ? findNode(change.nodeName) : null
            return (
              <div
                key={change.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                {/* Node name header */}
                <div className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {change.nodeName}
                </div>

                {/* Changes list */}
                <div className="space-y-2 text-sm">
                  {/* Address change */}
                  {change.changes?.address !== undefined && change.changes?.address !== originalNode?.address && (
                    <div className="grid grid-cols-[120px,1fr] gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Address:</span>
                      <div className="font-mono">
                        <div className="text-red-600 dark:text-red-400 line-through">
                          {originalNode?.address || '(empty)'}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          {change.changes?.address || '(empty)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wearer count change */}
                  {change.changes?.wearerCount !== undefined &&
                    change.changes?.wearerCount !== originalNode?.wearerCount && (
                      <div className="grid grid-cols-[120px,1fr] gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Wearer Count:</span>
                        <div>
                          <span className="text-red-600 dark:text-red-400 line-through mr-2">
                            {originalNode?.wearerCount ?? 0}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {change.changes?.wearerCount}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Max wearers change */}
                  {change.changes?.maxWearers !== undefined &&
                    change.changes?.maxWearers !== originalNode?.maxWearers && (
                      <div className="grid grid-cols-[120px,1fr] gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Max Wearers:</span>
                        <div>
                          <span className="text-red-600 dark:text-red-400 line-through mr-2">
                            {originalNode?.maxWearers ?? 1}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {change.changes?.maxWearers}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Color change */}
                  {change.changes?.color !== undefined && change.changes?.color !== originalNode?.color && (
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
                            style={{ backgroundColor: change.changes?.color }}
                          />
                          <span className="font-mono text-xs">{change.changes?.color}</span>
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
            Apply {totalChangesCount} {totalChangesCount === 1 ? 'Change' : 'Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
