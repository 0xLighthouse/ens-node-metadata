'use client'

import { Drawer } from 'vaul'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData, type TreeNodeType } from '@/contexts/TreeDataContext'
import { useState, useEffect } from 'react'

type NodeTypeFieldKey = 'website' | 'email' | 'organizationAddress'

interface NodeTypeSchema {
  label: string
  fields: Array<{
    key: NodeTypeFieldKey
    label: string
    type?: string
    placeholder?: string
  }>
}

const nodeTypeSchemas: Record<TreeNodeType, NodeTypeSchema> = {
  generic: { label: 'Generic', fields: [] },
  organizationRoot: {
    label: 'Organization Root',
    fields: [
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://example.org' },
      { key: 'organizationAddress', label: 'Organization Address', placeholder: '123 Main St' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'contact@example.org' },
    ],
  },
  treasury: { label: 'Treasury', fields: [] },
  role: { label: 'Role', fields: [] },
  team: { label: 'Team', fields: [] },
}

type NodeEditFormData = {
  nodeType?: TreeNodeType
  kind?: string
  address?: string
  website?: string
  email?: string
  organizationAddress?: string
}

export function NodeEditDrawer() {
  const { sourceTree, previewTree } = useTreeData()
  const {
    isEditDrawerOpen,
    selectedNode,
    closeEditDrawer,
    upsertEdit,
    getPendingEdit,
    discardPendingMutation,
  } = useTreeEditStore()

  // Find the node data in base tree
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

  // Find the node in full tree (including pending creations with edits)
  const findNodeInTree = (name: string, node = previewTree): any => {
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeInTree(name, child)
        if (found) return found
      }
    }
    return null
  }

  const nodeWithEdits = selectedNode ? findNodeInTree(selectedNode) : null
  const existingEdit = selectedNode ? getPendingEdit(selectedNode) : undefined
  const isPendingCreation = nodeWithEdits?.isPendingCreation || false

  // Form state
  const [formData, setFormData] = useState<NodeEditFormData>({})

  // Initialize form with current node data (including pending creation edits)
  useEffect(() => {
    if (!nodeWithEdits) return

    const editableKeys: Array<keyof NodeEditFormData> = [
      'nodeType',
      'kind',
      'address',
      'website',
      'email',
      'organizationAddress',
    ]

    const nextFormData: NodeEditFormData = {
      address: nodeWithEdits.address ?? '',
    }

    if (nodeWithEdits.nodeType) {
      nextFormData.nodeType = nodeWithEdits.nodeType
      nextFormData.kind = nodeWithEdits.kind
    }

    if (nodeWithEdits.nodeType === 'organizationRoot') {
      nextFormData.website = nodeWithEdits.website ?? ''
      nextFormData.email = nodeWithEdits.email ?? ''
      nextFormData.organizationAddress = nodeWithEdits.organizationAddress ?? ''
    }

    if (existingEdit?.changes) {
      for (const [key, value] of Object.entries(existingEdit.changes)) {
        if (value === undefined) continue
        if (editableKeys.includes(key as keyof NodeEditFormData)) {
          nextFormData[key as keyof NodeEditFormData] = value as NodeEditFormData[keyof NodeEditFormData]
        }
      }
    }

    setFormData(nextFormData)
  }, [existingEdit, nodeWithEdits])

  const handleNodeTypeChange = (nextType: TreeNodeType) => {
    const schema = nodeTypeSchemas[nextType]
    setFormData((prev) => {
      const next: NodeEditFormData = {
        ...prev,
        nodeType: nextType,
        kind: prev.kind ?? schema.label,
      }

      schema.fields.forEach((field) => {
        if (next[field.key] === undefined) {
          next[field.key] = ''
        }
      })

      return next
    })
  }

  const activeNodeType = formData.nodeType ?? nodeWithEdits?.nodeType
  const activeSchema = activeNodeType ? nodeTypeSchemas[activeNodeType] : null
  const shouldSelectType = !nodeWithEdits?.kind

  const handleSave = () => {
    if (!selectedNode) return

    upsertEdit(selectedNode, formData)
    closeEditDrawer()
  }

  const handleDiscard = () => {
    if (!selectedNode) return

    discardPendingMutation(selectedNode)
    closeEditDrawer()
  }

  const hasChanges =
    formData.address !== (nodeWithEdits?.address ?? '') ||
    formData.nodeType !== nodeWithEdits?.nodeType ||
    formData.kind !== nodeWithEdits?.kind ||
    formData.website !==
      (nodeWithEdits?.nodeType === 'organizationRoot' ? nodeWithEdits.website ?? '' : undefined) ||
    formData.email !==
      (nodeWithEdits?.nodeType === 'organizationRoot' ? nodeWithEdits.email ?? '' : undefined) ||
    formData.organizationAddress !==
      (nodeWithEdits?.nodeType === 'organizationRoot'
        ? nodeWithEdits.organizationAddress ?? ''
        : undefined)

  // Only show discard button for actual edits (not pending creations)
  const hasPendingEdits = !isPendingCreation && !!existingEdit

  return (
    <Drawer.Root open={isEditDrawerOpen} onOpenChange={(open) => !open && closeEditDrawer()} direction="right">
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
                {nodeWithEdits?.name}
              </Drawer.Description>
            </div>

            {/* Form */}
            {nodeWithEdits && !nodeWithEdits.isSuggested && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {shouldSelectType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Node Type
                    </label>
                    <select
                      value={formData.nodeType ?? ''}
                      onChange={(e) => handleNodeTypeChange(e.target.value as TreeNodeType)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="" disabled>
                        Select a type
                      </option>
                      {Object.entries(nodeTypeSchemas).map(([value, schema]) => (
                        <option key={value} value={value}>
                          {schema.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Pick a type to reveal its fields.
                    </p>
                  </div>
                )}

                {activeSchema?.fields.length ? (
                  <div className="space-y-4">
                    {activeSchema.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type ?? 'text'}
                          value={formData[field.key] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

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

              </div>
            )}

            {/* Suggested Node Message */}
            {nodeWithEdits?.isSuggested && (
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
                  onClick={closeEditDrawer}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || nodeWithEdits?.isSuggested}
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
