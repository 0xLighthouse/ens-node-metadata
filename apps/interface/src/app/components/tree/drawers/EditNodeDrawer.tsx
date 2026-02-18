'use client'

import { Drawer } from 'vaul'
import { X, ExternalLink, Trash2 } from 'lucide-react'
import { AddressField } from './AddressField'
import { SchemaEditor } from './SchemaEditor'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData } from '@/hooks/useTreeData'
import { useEffect } from 'react'
import { useSchemaStore } from '@/stores/schemas'
import { useNodeEditorStore } from '@/stores/node-editor'

export function EditNodeDrawer() {
  const { sourceTree, previewTree } = useTreeData()
  const { schemas, fetchSchemas } = useSchemaStore()
  const {
    isEditDrawerOpen,
    selectedNode,
    closeEditDrawer,
    upsertEdit,
    getPendingEdit,
    discardPendingMutation,
  } = useTreeEditStore()

  const {
    formData,
    currentSchemaId,
    visibleOptionalFields,
    isAddingCustomAttribute,
    newAttributeKey,
    isLoadingSchemas,
    initializeEditor,
    resetEditor,
    updateField,
    setCurrentSchema,
    setIsLoadingSchemas,
    setIsAddingCustomAttribute,
    setNewAttributeKey,
    addCustomAttribute,
    removeCustomAttribute,
    hasChanges: storeHasChanges,
    getChangedFields,
  } = useNodeEditorStore()

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

  const nodeWithEdits =
    selectedNode && previewTree ? findNodeInTree(selectedNode, previewTree) : null
  const existingEdit = selectedNode ? getPendingEdit(selectedNode) : undefined
  const isPendingCreation = nodeWithEdits?.isPendingCreation || false

  // Get the active schema - either the one selected in this session or the node's existing schema
  const nodeSchemaId = nodeWithEdits?.schema || nodeWithEdits?.texts?.schema
  const activeSchema = currentSchemaId
    ? schemas.find((s) => s.id === currentSchemaId)
    : nodeSchemaId
      ? schemas.find((s) => s.id === nodeSchemaId)
      : null

  const addressFields = activeSchema?.properties
    ? Object.entries(activeSchema.properties).filter(([key]) => key === 'address')
    : []
  const addressFieldKeys = new Set(addressFields.map(([key]) => key))

  // Fetch schemas on mount if not loaded
  useEffect(() => {
    if (schemas.length === 0 && !isLoadingSchemas) {
      setIsLoadingSchemas(true)
      fetchSchemas().finally(() => setIsLoadingSchemas(false))
    }
  }, [schemas.length, fetchSchemas, isLoadingSchemas, setIsLoadingSchemas])

  const handleSelectSchema = (schemaId: string) => {
    const schema = schemas.find((s) => s.id === schemaId)
    if (!schema) return
    setCurrentSchema(schemaId, schema, nodeWithEdits)
  }

  const handleRefreshSchemas = async () => {
    setIsLoadingSchemas(true)
    await fetchSchemas()
    setIsLoadingSchemas(false)
  }

  // Initialize form with current node data (including pending creation edits)
  useEffect(() => {
    if (!nodeWithEdits) return

    console.log('----- NODE EDIT DRAWER -----')
    console.log('Node data:', nodeWithEdits)
    console.log('Existing edit:', existingEdit)
    console.log('Is pending creation:', isPendingCreation)

    initializeEditor(nodeWithEdits, existingEdit, schemas)
  }, [existingEdit, nodeWithEdits, isPendingCreation, schemas, initializeEditor])

  const handleSave = () => {
    if (!selectedNode || !nodeWithEdits) return

    const originalNode = findNode(selectedNode)
    const { changes, deleted } = getChangedFields(originalNode, activeSchema)

    // Build texts baseline from original node
    const texts: Record<string, string | null> = {}
    if (originalNode?.texts && typeof originalNode.texts === 'object') {
      for (const [k, v] of Object.entries(originalNode.texts)) {
        texts[k] = v as string | null
      }
    }

    upsertEdit(selectedNode, texts, changes, deleted)
    closeEditDrawer()
    resetEditor()
  }

  const handleDiscard = () => {
    if (!selectedNode) return

    discardPendingMutation(selectedNode)
    closeEditDrawer()
    resetEditor()
  }

  const hasChanges = storeHasChanges(nodeWithEdits, activeSchema)

  // Only show discard button for actual edits (not pending creations)
  const hasPendingEdits = !isPendingCreation && !!existingEdit

  if (!sourceTree || !previewTree) {
    return null
  }

  const handleDrawerClose = () => {
    closeEditDrawer()
    resetEditor()
  }

  return (
    <Drawer.Root
      open={isEditDrawerOpen}
      onOpenChange={(open) => !open && handleDrawerClose()}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 pointer-events-none" />
        <Drawer.Content
          className="right-4 top-20 bottom-4 fixed z-50 outline-none w-[500px] flex"
          style={{ '--initial-transform': 'calc(100% + 16px)' } as React.CSSProperties}
        >
          <div className="h-full w-full grow p-6 flex flex-col rounded-r-[16px] border-l border-white bg-[rgb(247,247,248)] dark:bg-neutral-900">
            {/* Header */}
            <div className="mb-4 relative">
              <button
                onClick={handleDrawerClose}
                className="absolute -top-2 -right-2 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>

              <Drawer.Title className="font-semibold text-2xl text-gray-900 dark:text-white mb-3">
                {nodeWithEdits?.name}
              </Drawer.Title>

              <Drawer.Description className="sr-only">{nodeWithEdits?.name}</Drawer.Description>

              {/* Schema label row — display only; schema switching handled by SchemaEditor below */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schema</span>
                {activeSchema ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {activeSchema.class}
                    </span>
                    <a
                      href={activeSchema.id.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      v{activeSchema.version}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
                )}
              </div>
            </div>

            {/* Form */}
            {nodeWithEdits && !nodeWithEdits.isSuggested && (
              <div className="flex-1 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Schema selector + fields */}
                <SchemaEditor
                  activeSchema={activeSchema ?? null}
                  addressFieldKeys={addressFieldKeys}
                  onSelectSchema={handleSelectSchema}
                  onRefreshSchemas={handleRefreshSchemas}
                />

                {/* Text Records Section */}
                {nodeWithEdits &&
                  (() => {
                    const schemaKeys = new Set(
                      Object.keys(activeSchema?.properties ?? {}).map((k) => {
                        // Handle keys like '_.focus' by removing the prefix
                        return k.replace(/^_\./, '')
                      }),
                    )

                    // Collect extra keys ONLY from texts (not top-level system fields)
                    // Text Records should only show custom ENSIP-5 text records
                    const extraKeys: string[] = []

                    if (nodeWithEdits.texts && typeof nodeWithEdits.texts === 'object') {
                      Object.keys(nodeWithEdits.texts).forEach((key) => {
                        if (!schemaKeys.has(key)) {
                          extraKeys.push(key)
                        }
                      })
                    }

                    return (
                      <div>
                        {/* Address fields */}
                        {addressFields.length > 0 && (
                          <div className="space-y-2 mb-6">
                            {addressFields.map(([key]) => (
                              <AddressField
                                key={key}
                                label={key}
                                value={formData[key] ?? ''}
                                onChange={(v) => updateField(key, v)}
                              />
                            ))}
                          </div>
                        )}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Text Records
                            </h3>
                            {!isAddingCustomAttribute && (
                              <button
                                type="button"
                                onClick={() => setIsAddingCustomAttribute(true)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                              >
                                + Record
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {/* Empty state */}
                            {extraKeys.length === 0 && !isAddingCustomAttribute && (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p className="text-sm">No text records yet</p>
                                <p className="text-xs mt-1">Add custom ENSIP-5 text records</p>
                              </div>
                            )}

                            {/* Existing custom attributes */}
                            {extraKeys.map((key) => {
                              const isMarkedForDeletion = formData[key] === null
                              const originalValue = (nodeWithEdits.texts as any)?.[key] ?? ''
                              const currentValue = formData[key] ?? originalValue

                              if (isMarkedForDeletion) {
                                return (
                                  <div
                                    key={key}
                                    className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <label className="block text-sm font-medium text-red-500 dark:text-red-400 line-through">
                                        {key}
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => updateField(key, originalValue)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                                      >
                                        Undo
                                      </button>
                                    </div>
                                    <div className="w-full px-3 py-2 text-sm text-red-400 dark:text-red-500 line-through truncate">
                                      {String(originalValue)}
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={key}
                                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {key}
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => removeCustomAttribute(key)}
                                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => updateField(key, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  />
                                </div>
                              )
                            })}

                            {/* Add new custom attribute form */}
                            {isAddingCustomAttribute && (
                              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={newAttributeKey}
                                    onChange={(e) => setNewAttributeKey(e.target.value)}
                                    placeholder="Attribute key (e.g., com.twitter)"
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newAttributeKey.trim()) {
                                        addCustomAttribute(newAttributeKey)
                                      }
                                    }}
                                    disabled={!newAttributeKey.trim()}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingCustomAttribute(false)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Add a custom text record following ENSIP-5 naming conventions
                                </p>
                              </div>
                            )}
                          </div>
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
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <button
                  onClick={handleDrawerClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || nodeWithEdits?.isSuggested}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply changes
                </button>
              </div>
              {hasPendingEdits && (
                <button
                  onClick={handleDiscard}
                  className="w-full px-4 py-2 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Discard changes
                </button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
