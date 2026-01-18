'use client'

import { Drawer } from 'vaul'
import { useEditStore } from '@/stores/edits'
import { useDomainTree, type DomainTreeNode } from '@/contexts/DomainTreeContext'
import { useState, useEffect } from 'react'

interface NodeCreateDrawerProps {
  isOpen: boolean
  onClose: () => void
  suggestionId: string
  suggestionTitle: string
  nodes: DomainTreeNode[]
}

export function NodeCreateDrawer({ isOpen, onClose, suggestionId, suggestionTitle, nodes }: NodeCreateDrawerProps) {
  const { baseTree, tree } = useDomainTree()
  const { addCreation } = useEditStore()

  const [selectedParent, setSelectedParent] = useState<string>(baseTree.name)

  // Reset to root when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSelectedParent(baseTree.name)
    }
  }, [isOpen, baseTree.name])

  // Collect all nodes that can be parents (all existing nodes, including pending creations)
  const collectAllNodes = (node: DomainTreeNode): { name: string; depth: number }[] => {
    const nodes: { name: string; depth: number }[] = []

    const traverse = (n: DomainTreeNode, depth: number) => {
      nodes.push({ name: n.name, depth })
      if (n.children) {
        n.children.forEach(child => traverse(child, depth + 1))
      }
    }

    traverse(node, 0)
    return nodes
  }

  const availableParents = collectAllNodes(tree)

  const handleCreate = () => {
    addCreation(suggestionId, selectedParent, nodes)
    onClose()
  }

  // Helper to count all nodes recursively
  const countNodes = (nodesToCount: DomainTreeNode[]): number => {
    return nodesToCount.reduce((count, node) => {
      return count + 1 + (node.children ? countNodes(node.children) : 0)
    }, 0)
  }

  // Helper to render node tree preview
  const renderNodePreview = (nodesToRender: DomainTreeNode[], depth = 0) => {
    return nodesToRender.map((node, idx) => (
      <div key={idx} className={`${depth > 0 ? 'ml-6' : ''} space-y-2`}>
        <div className="text-green-700 dark:text-green-300 flex items-start gap-2">
          <span className="mt-1">+</span>
          <div className="flex-1">
            <div className="font-mono font-semibold text-sm">{node.name}</div>
            {/* Attributes preview */}
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
            </div>
          </div>
        </div>
        {/* Render children recursively */}
        {node.children && node.children.length > 0 && (
          <div>{renderNodePreview(node.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  const totalNodes = countNodes(nodes)

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-50 outline-none w-[500px] flex"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <div className="bg-white dark:bg-gray-900 h-full w-full grow p-6 flex flex-col rounded-[16px] shadow-xl">
            {/* Header */}
            <div className="mb-6">
              <Drawer.Title className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                Create Nodes
              </Drawer.Title>
              <Drawer.Description className="text-sm text-gray-600 dark:text-gray-400">
                {suggestionTitle}
              </Drawer.Description>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Parent Node Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Node
                </label>
                <select
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  {availableParents.map((parent) => (
                    <option key={parent.name} value={parent.name}>
                      {'  '.repeat(parent.depth)}
                      {parent.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose where to create these nodes
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview ({totalNodes} {totalNodes === 1 ? 'node' : 'nodes'})
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-950 space-y-3">
                  {renderNodePreview(nodes)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Create {totalNodes} {totalNodes === 1 ? 'Node' : 'Nodes'}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
