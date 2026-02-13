'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData } from '@/hooks/useTreeData'
import { type TreeNodeType, type OrganizationRootTreeNode } from '@/lib/tree/types'

interface ApplyChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ApplyChangesDialog({ open, onOpenChange, onConfirm }: ApplyChangesDialogProps) {
  const { pendingMutations } = useTreeEditStore()
  const { sourceTree } = useTreeData()

  if (!sourceTree) {
    return null
  }

  const formatNodeType = (nodeType?: TreeNodeType) => {
    if (!nodeType) return 'Unknown'
    const labels: Record<TreeNodeType, string> = {
      generic: 'Generic',
      organizationRoot: 'Organization Root',
      treasury: 'Treasury',
      role: 'Role',
      team: 'Team',
    }
    return labels[nodeType] ?? nodeType
  }

  // Find the original node data
  const findNode = (name: string, node = sourceTree): any => {
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(name, child)
        if (found) return found
      }
    }
    return null
  }

  const changesArray = Array.from(pendingMutations.values())

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
                            {node.nodeType && (
                              <div>Type: {formatNodeType(node.nodeType)}</div>
                            )}
                            {node.description && (
                              <div>Description: {node.description}</div>
                            )}
                            {node.address && (
                              <div>Address: {node.address}</div>
                            )}
                            {node.website && (
                              <div>Website: {node.website}</div>
                            )}
                            {node.organizationAddress && (
                              <div>Organization Address: {node.organizationAddress}</div>
                            )}
                            {node.email && (
                              <div>Email: {node.email}</div>
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
            const originalOrgNode =
              originalNode?.nodeType === 'organizationRoot'
                ? (originalNode as OrganizationRootTreeNode)
                : undefined
            const changeOrgFields = change.changes as
              | Partial<OrganizationRootTreeNode>
              | undefined
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
                <div className="space-y-1 text-sm">
                  {/* Show all changes dynamically */}
                  {change.changes && (() => {
                    const entries = Object.entries(change.changes).filter(([key, newValue]) => {
                      const originalValue = (originalNode as any)?.[key]
                      // Skip if values are the same
                      if (newValue === originalValue) return false
                      // Skip empty values
                      if (newValue === null || newValue === undefined || newValue === '') return false
                      // Skip inspectionData (we'll show it separately)
                      if (key === 'inspectionData') return false
                      return true
                    })

                    const addedFields = entries.filter(([key, newValue]) => {
                      const originalValue = (originalNode as any)?.[key]
                      return originalValue === undefined || originalValue === null || originalValue === ''
                    })

                    const modifiedFields = entries.filter(([key, newValue]) => {
                      const originalValue = (originalNode as any)?.[key]
                      return originalValue !== undefined && originalValue !== null && originalValue !== ''
                    })

                    return (
                      <>
                        {/* Added fields section */}
                        {addedFields.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-green-600 dark:text-green-500 font-semibold mb-2 flex items-center gap-1">
                              <span className="bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded">Added</span>
                            </div>
                            {addedFields.map(([key, newValue]) => {
                              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                              return (
                                <div key={key} className="flex items-center gap-3 py-1 ml-4">
                                  <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{displayKey}:</span>
                                  <span className={`flex-1 text-green-600 dark:text-green-400 font-medium ${key === 'address' ? 'font-mono' : ''}`}>
                                    {String(newValue)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Modified fields section */}
                        {modifiedFields.length > 0 && (
                          <div>
                            {modifiedFields.map(([key, newValue]) => {
                              const originalValue = (originalNode as any)?.[key]
                              const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                              return (
                                <div key={key} className="flex items-center gap-3 py-1">
                                  <span className="text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">{displayKey}:</span>
                                  <span className={`flex-1 ${key === 'address' ? 'font-mono' : ''}`}>
                                    <span className="text-red-600 dark:text-red-400 line-through mr-2">
                                      {String(originalValue)}
                                    </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      {String(newValue)}
                                    </span>
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )
                  })()}
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
