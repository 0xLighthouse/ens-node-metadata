'use client'

import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData } from '@/hooks/useTreeData'
import { type TreeNodeType } from '@/lib/tree/types'
import { useState, useEffect } from 'react'
import { SchemaVersion } from '../SchemaVersion'
import { useSchemaStore } from '@/stores/schemas'

type NodeEditFormData = Record<string, any>

export function EditNodeDrawer() {
  const { sourceTree, previewTree } = useTreeData()
  const { getSelectedSchema } = useSchemaStore()
  const selectedSchema = getSelectedSchema()
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
    if (!node) return null
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
    if (!node) return null
    if (node.name === name) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeInTree(name, child)
        if (found) return found
      }
    }
    return null
  }

  const nodeWithEdits = selectedNode && previewTree ? findNodeInTree(selectedNode, previewTree) : null
  const existingEdit = selectedNode ? getPendingEdit(selectedNode) : undefined
  const isPendingCreation = nodeWithEdits?.isPendingCreation || false

  // Form state
  const [formData, setFormData] = useState<NodeEditFormData>({})

  // Initialize form with current node data (including pending creation edits)
  useEffect(() => {
    if (!nodeWithEdits) return

    console.log('----- NODE EDIT DRAWER -----')
    console.log('Node data:', nodeWithEdits)
    console.log('Existing edit:', existingEdit)
    console.log('Is pending creation:', isPendingCreation)
    console.log('Selected schema:', selectedSchema)

    const nextFormData: NodeEditFormData = {}

    // Add schema and type to form data if schema is selected
    if (selectedSchema) {
      nextFormData.schema = selectedSchema.id
      nextFormData.type = selectedSchema.name
    }

    // Initialize from node data and schema attributes
    if (selectedSchema?.attributes) {
      selectedSchema.attributes.forEach((attr) => {
        nextFormData[attr.key] = (nodeWithEdits as any)[attr.key] ?? ''
      })
    }

    // Apply any pending edits
    if (existingEdit?.changes) {
      for (const [key, value] of Object.entries(existingEdit.changes)) {
        if (value !== undefined) {
          nextFormData[key] = value
        }
      }
    }

    setFormData(nextFormData)
  }, [existingEdit, nodeWithEdits, selectedSchema])

  const handleSave = () => {
    if (!selectedNode) return

    console.log('----- SAVING NODE CHANGES -----')
    console.log('Node:', selectedNode)
    console.log('Form data to save:', formData)

    // formData already includes schema and type if a schema is selected
    upsertEdit(selectedNode, formData)
    closeEditDrawer()
  }

  const handleDiscard = () => {
    if (!selectedNode) return

    discardPendingMutation(selectedNode)
    closeEditDrawer()
  }

  const hasChanges = (() => {
    // Check schema and type changes
    const schemaTypeChanges =
      formData.schema !== (nodeWithEdits as any)?.schema ||
      formData.type !== (nodeWithEdits as any)?.type

    // Check schema attributes for changes
    const schemaChanges = selectedSchema?.attributes?.some((attr) => {
      const currentValue = formData[attr.key] ?? ''
      const originalValue = (nodeWithEdits as any)?.[attr.key] ?? ''
      return currentValue !== originalValue
    }) ?? false

    // Check extra attributes for changes (including cleared ones)
    const extraChanges = Object.keys(formData).some((key) => {
      // Skip schema and type as we already checked them
      if (key === 'schema' || key === 'type') return false

      const schemaKeys = new Set(selectedSchema?.attributes?.map(a => a.key) || [])
      if (schemaKeys.has(key)) return false // Already checked above

      const currentValue = formData[key]
      const originalValue = (nodeWithEdits as any)?.[key]
      return currentValue !== originalValue
    })

    return schemaTypeChanges || schemaChanges || extraChanges
  })()

  // Only show discard button for actual edits (not pending creations)
  const hasPendingEdits = !isPendingCreation && !!existingEdit

  if (!sourceTree || !previewTree) {
    return null
  }

  return (
    <Drawer.Root open={isEditDrawerOpen} onOpenChange={(open) => !open && closeEditDrawer()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 pointer-events-none" />
        <Drawer.Content
          className="right-4 top-20 bottom-4 fixed z-50 outline-none w-[400px] flex"
          style={{ '--initial-transform': 'calc(100% + 16px)' } as React.CSSProperties}
        >
          <div className="h-full w-full grow p-6 flex flex-col rounded-r-[16px] border-l border-white bg-[rgb(247,247,248)] dark:bg-neutral-900">
            {/* Header */}
            <div className="mb-4 relative">
              <button
                onClick={closeEditDrawer}
                className="absolute -top-2 -right-2 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
              <Drawer.Title className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                Edit Node
              </Drawer.Title>
              <Drawer.Description className="text-sm text-gray-600 dark:text-gray-400">
                {nodeWithEdits?.name}
              </Drawer.Description>
            </div>

            {/* Schema Version */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <SchemaVersion />
            </div>

            {/* Form */}
            {nodeWithEdits && !nodeWithEdits.isSuggested && (
              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Schema-based Fields */}
                {selectedSchema?.attributes && selectedSchema.attributes.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSchema.attributes.map((attribute) => (
                      <div key={attribute.key}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {attribute.name}
                          {attribute.isRequired && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <input
                          type={attribute.type === 'string' ? 'text' : attribute.type}
                          value={formData[attribute.key] ?? ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [attribute.key]: e.target.value,
                            }))
                          }
                          placeholder={attribute.description}
                          required={attribute.isRequired}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                        {attribute.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {attribute.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No schema selected</p>
                    <p className="text-xs mt-1">Select a schema to see available fields</p>
                  </div>
                )}

                {/* Extra Attributes Not in Schema */}
                {selectedSchema && nodeWithEdits && (() => {
                  const schemaKeys = new Set(selectedSchema.attributes?.map(a => a.key) || [])
                  const nodeKeys = Object.keys(nodeWithEdits).filter(key =>
                    !['name', 'children', 'subdomainCount', 'resolverId', 'address', 'owner', 'ttl', 'icon', 'isSuggested', 'isPendingCreation'].includes(key)
                  )
                  const extraKeys = nodeKeys.filter(key => !schemaKeys.has(key) && nodeWithEdits[key as keyof typeof nodeWithEdits] !== undefined)

                  if (extraKeys.length === 0) return null

                  return (
                    <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-4 h-4 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <h3 className="text-sm font-medium text-orange-700 dark:text-orange-400">
                          Extra Attributes (Not in Schema)
                        </h3>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mb-3">
                        These attributes exist on the node but are not part of the selected schema. You may want to remove them.
                      </p>
                      <div className="space-y-3">
                        {extraKeys.map((key) => (
                          <div key={key} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <label className="block text-sm font-medium text-orange-900 dark:text-orange-300">
                                {key}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const next = { ...prev }
                                    next[key] = null
                                    return next
                                  })
                                }}
                                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 underline"
                              >
                                Clear
                              </button>
                            </div>
                            <input
                              type="text"
                              value={formData[key] ?? nodeWithEdits[key as keyof typeof nodeWithEdits] ?? ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-orange-300 dark:border-orange-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

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
