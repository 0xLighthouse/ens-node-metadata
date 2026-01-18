'use client'

import { Drawer } from 'vaul'
import { useEditStore } from '@/stores/edits'
import { useDomainTree } from '@/contexts/DomainTreeContext'
import { useState, useEffect } from 'react'
import type { NodeEdit } from '@/stores/edits'

export function NodeEditDrawer() {
  const { tree } = useDomainTree()
  const { isDrawerOpen, selectedNodeForEdit, closeDrawer, addEdit, getEditForNode, removeEdit } = useEditStore()

  // Find the node data
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

  const currentNode = selectedNodeForEdit ? findNode(selectedNodeForEdit) : null
  const existingEdit = selectedNodeForEdit ? getEditForNode(selectedNodeForEdit) : undefined

  // Form state
  const [formData, setFormData] = useState<Partial<NodeEdit>>({})

  // Initialize form with current node data + any existing edits
  useEffect(() => {
    if (currentNode) {
      setFormData({
        address: existingEdit?.address ?? currentNode.address ?? '',
        wearerCount: existingEdit?.wearerCount ?? currentNode.wearerCount ?? 0,
        maxWearers: existingEdit?.maxWearers ?? currentNode.maxWearers ?? 1,
        color: existingEdit?.color ?? currentNode.color ?? '#94a3b8',
      })
    }
  }, [currentNode, existingEdit])

  const handleSave = () => {
    if (!selectedNodeForEdit) return

    addEdit(selectedNodeForEdit, formData)
    closeDrawer()
  }

  const handleDiscard = () => {
    if (!selectedNodeForEdit) return

    removeEdit(selectedNodeForEdit)
    closeDrawer()
  }

  const hasChanges =
    formData.address !== (currentNode?.address ?? '') ||
    formData.wearerCount !== (currentNode?.wearerCount ?? 0) ||
    formData.maxWearers !== (currentNode?.maxWearers ?? 1) ||
    formData.color !== (currentNode?.color ?? '#94a3b8')

  const hasPendingEdits = !!existingEdit

  return (
    <Drawer.Root open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-50 outline-none w-[400px] flex"
          style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
        >
          <div className="bg-white dark:bg-gray-900 h-full w-full grow p-6 flex flex-col rounded-[16px] shadow-xl">
            {/* Header */}
            <div className="mb-6">
              <Drawer.Title className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                Edit Node
              </Drawer.Title>
              <Drawer.Description className="text-sm text-gray-600 dark:text-gray-400">
                {currentNode?.name}
              </Drawer.Description>
            </div>

            {/* Form */}
            {currentNode && !currentNode.isSuggested && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0x0000...0000"
                  />
                </div>

                {/* Wearer Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wearer Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.wearerCount || 0}
                    onChange={(e) => setFormData({ ...formData, wearerCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Max Wearers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Wearers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxWearers || 1}
                    onChange={(e) => setFormData({ ...formData, maxWearers: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color || '#94a3b8'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color || '#94a3b8'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Node Message */}
            {currentNode?.isSuggested && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">This is a suggested node.</p>
                  <p className="text-xs mt-1">Create it to edit properties.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {hasPendingEdits && (
                <button
                  onClick={handleDiscard}
                  className="w-full px-4 py-2 bg-orange-50 border border-orange-300 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Discard Changes
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={closeDrawer}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || currentNode?.isSuggested}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Changes
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
