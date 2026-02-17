'use client'

import { Drawer } from 'vaul'
import { X, ExternalLink, Link2, ChevronDown, Search, RefreshCw, Trash2 } from 'lucide-react'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData } from '@/hooks/useTreeData'
import { type TreeNodeType } from '@/lib/tree/types'
import { useState, useEffect, useRef } from 'react'
import { SchemaVersion } from '../SchemaVersion'
import { useSchemaStore } from '@/stores/schemas'
import { useNodeEditorStore } from '@/stores/node-editor'

export function EditNodeDrawer() {
  const { sourceTree, previewTree } = useTreeData()
  const { schemas, selectSchema, fetchSchemas } = useSchemaStore()
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
    isSchemaDropdownOpen,
    schemaSearchQuery,
    isLoadingSchemas,
    isOptionalFieldDropdownOpen,
    initializeEditor,
    resetEditor,
    updateField,
    setCurrentSchema,
    addOptionalField,
    removeOptionalField,
    toggleSchemaDropdown,
    setSchemaSearchQuery,
    setIsLoadingSchemas,
    toggleOptionalFieldDropdown,
    setIsAddingCustomAttribute,
    setNewAttributeKey,
    addCustomAttribute,
    removeCustomAttribute,
    getFormData,
    hasChanges: storeHasChanges,
    getChangedFields,
  } = useNodeEditorStore()

  const schemaDropdownRef = useRef<HTMLDivElement>(null)
  const optionalFieldDropdownRef = useRef<HTMLDivElement>(null)

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
  const activeSchema = currentSchemaId
    ? schemas.find((s) => s.id === currentSchemaId)
    : nodeWithEdits?.schema
      ? schemas.find((s) => s.id === nodeWithEdits.schema)
      : null

  // Close schema dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (schemaDropdownRef.current && !schemaDropdownRef.current.contains(event.target as Node)) {
        if (isSchemaDropdownOpen) {
          toggleSchemaDropdown()
        }
      }
    }

    if (isSchemaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSchemaDropdownOpen, toggleSchemaDropdown])

  // Close optional field dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionalFieldDropdownRef.current &&
        !optionalFieldDropdownRef.current.contains(event.target as Node)
      ) {
        if (isOptionalFieldDropdownOpen) {
          toggleOptionalFieldDropdown()
        }
      }
    }

    if (isOptionalFieldDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOptionalFieldDropdownOpen, toggleOptionalFieldDropdown])

  // Fetch schemas on mount if not loaded
  useEffect(() => {
    if (schemas.length === 0 && !isLoadingSchemas) {
      setIsLoadingSchemas(true)
      fetchSchemas().finally(() => setIsLoadingSchemas(false))
    }
  }, [schemas.length, fetchSchemas, isLoadingSchemas, setIsLoadingSchemas])

  const filteredSchemas = schemas
    .filter((schema) => schema.isLatest)
    .filter((schema) =>
      schema.class.toLowerCase().includes(schemaSearchQuery.toLowerCase()),
    )

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
    const changedFields = getChangedFields(originalNode, activeSchema)

    // Build texts baseline from original node
    const texts: Record<string, string | null> = {}
    if (originalNode?.texts && typeof originalNode.texts === 'object') {
      for (const [k, v] of Object.entries(originalNode.texts)) {
        texts[k] = v as string | null
      }
    }

    upsertEdit(selectedNode, texts, changedFields)
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

              {nodeWithEdits?.schema && activeSchema ? (
                // Header when schema is applied
                <>
                  <Drawer.Title className="font-semibold text-2xl text-gray-900 dark:text-white mb-1.5">
                    {nodeWithEdits?.name}
                  </Drawer.Title>
                  <div className="flex items-center gap-2">
                    <Drawer.Description className="text-base text-gray-700 dark:text-gray-300 font-medium">
                      {activeSchema.class}
                    </Drawer.Description>
                    <ExternalLink className="size-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({activeSchema.version})
                    </span>
                  </div>
                </>
              ) : (
                // Header when no schema
                <>
                  <Drawer.Title className="font-semibold text-2xl text-gray-900 dark:text-white mb-1">
                    Edit Node
                  </Drawer.Title>
                  <Drawer.Description className="text-base text-gray-600 dark:text-gray-400">
                    {nodeWithEdits?.name}
                  </Drawer.Description>
                </>
              )}
            </div>

            {/* Form */}
            {nodeWithEdits && !nodeWithEdits.isSuggested && (
              <div className="flex-1 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Schema-based Fields */}
                {activeSchema?.properties && Object.keys(activeSchema.properties).length > 0 ? (
                  <fieldset className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    {/* Schema selector at top */}
                    <div
                      className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 relative"
                      ref={schemaDropdownRef}
                    >
                      <button
                        type="button"
                        onClick={toggleSchemaDropdown}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline transition-colors mb-1"
                      >
                        <Link2 className="size-4" />
                        <span>
                          {activeSchema.class} - v{activeSchema.version}
                        </span>
                      </button>
                      {activeSchema.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                          {activeSchema.description}
                        </p>
                      )}

                      {/* Schema Dropdown */}
                      {isSchemaDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search
                                  size={14}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Search schemas..."
                                  value={schemaSearchQuery}
                                  onChange={(e) => setSchemaSearchQuery(e.target.value)}
                                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  autoFocus
                                />
                              </div>

                              {/* Refresh Button */}
                              <button
                                onClick={handleRefreshSchemas}
                                disabled={isLoadingSchemas}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Refresh schemas"
                              >
                                <RefreshCw
                                  size={14}
                                  className={isLoadingSchemas ? 'animate-spin' : ''}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Schema List */}
                          <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {isLoadingSchemas ? (
                              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                Loading schemas...
                              </div>
                            ) : filteredSchemas.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No schemas found
                              </div>
                            ) : (
                              filteredSchemas.map((schema) => (
                                <button
                                  key={schema.id}
                                  onClick={() => handleSelectSchema(schema.id)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    activeSchema?.id === schema.id
                                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <div className="font-medium">
                                    {schema.class}{' '}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                      (v{schema.version})
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {Object.entries(activeSchema.properties)
                        .filter(([key]) => activeSchema.required?.includes(key) || visibleOptionalFields.has(key))
                        .map(([key, attribute]) => {
                          const isRequired = activeSchema.required?.includes(key)
                          const isTextArea =
                            attribute.type === 'text' || key === 'description'

                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {key}
                                  {isRequired && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {!isRequired && (
                                  <button
                                    type="button"
                                    onClick={() => removeOptionalField(key)}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {isTextArea ? (
                                <textarea
                                  value={formData[key] ?? ''}
                                  onChange={(e) => updateField(key, e.target.value)}
                                  placeholder={attribute.description}
                                  required={isRequired}
                                  rows={4}
                                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white resize-y"
                                />
                              ) : (
                                <input
                                  type={attribute.type === 'string' ? 'text' : attribute.type}
                                  value={formData[key] ?? ''}
                                  onChange={(e) => updateField(key, e.target.value)}
                                  placeholder={attribute.description}
                                  required={isRequired}
                                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                                />
                              )}
                            </div>
                          )
                        })}
                    </div>

                    {/* Add Optional Field Button */}
                    {Object.entries(activeSchema.properties).some(
                      ([key]) => !activeSchema.required?.includes(key) && !visibleOptionalFields.has(key),
                    ) && (
                      <div
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 relative"
                        ref={optionalFieldDropdownRef}
                      >
                        <button
                          type="button"
                          onClick={toggleOptionalFieldDropdown}
                          className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
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
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add optional field
                        </button>

                        {/* Optional Field Dropdown */}
                        {isOptionalFieldDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {Object.entries(activeSchema.properties)
                              .filter(
                                ([key]) => !activeSchema.required?.includes(key) && !visibleOptionalFields.has(key),
                              )
                              .map(([key, attribute]) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => addOptionalField(key)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {key}
                                  </div>
                                  {attribute.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {attribute.description}
                                    </div>
                                  )}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </fieldset>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 mb-4">
                      <p className="text-sm font-medium">No schema selected</p>
                      <p className="text-xs mt-1">Select a schema to see available fields</p>
                    </div>

                    {/* Schema selector when no schema */}
                    <div className="relative" ref={schemaDropdownRef}>
                      <button
                        onClick={toggleSchemaDropdown}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        <span className="text-gray-500 dark:text-gray-400">Select a schema...</span>
                        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>

                      {/* Schema Dropdown */}
                      {isSchemaDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search
                                  size={14}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Search schemas..."
                                  value={schemaSearchQuery}
                                  onChange={(e) => setSchemaSearchQuery(e.target.value)}
                                  className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  autoFocus
                                />
                              </div>

                              {/* Refresh Button */}
                              <button
                                onClick={handleRefreshSchemas}
                                disabled={isLoadingSchemas}
                                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Refresh schemas"
                              >
                                <RefreshCw
                                  size={14}
                                  className={isLoadingSchemas ? 'animate-spin' : ''}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Schema List */}
                          <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {isLoadingSchemas ? (
                              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                Loading schemas...
                              </div>
                            ) : filteredSchemas.length === 0 ? (
                              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No schemas found
                              </div>
                            ) : (
                              filteredSchemas.map((schema) => (
                                <button
                                  key={schema.id}
                                  onClick={() => handleSelectSchema(schema.id)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                                >
                                  <div className="font-medium">
                                    {schema.class}{' '}
                                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                      (v{schema.version})
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                    // Only check nested texts (e.g., texts.avatar, texts.com.twitter)
                    if (nodeWithEdits.texts && typeof nodeWithEdits.texts === 'object') {
                      Object.keys(nodeWithEdits.texts).forEach((key) => {
                        if (!schemaKeys.has(key)) {
                          extraKeys.push(`texts.${key}`)
                        }
                      })
                    }

                    return (
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            // Get the value, handling nested attributes
                            const getValue = () => {
                              if (key.startsWith('texts.')) {
                                const nestedKey = key.replace('texts.', '')
                                return (
                                  formData[key] ??
                                  (nodeWithEdits.texts as any)?.[nestedKey] ??
                                  ''
                                )
                              }
                              return (
                                formData[key] ??
                                nodeWithEdits[key as keyof typeof nodeWithEdits] ??
                                ''
                              )
                            }

                            // Display key without "texts." prefix
                            const displayKey = key.startsWith('texts.')
                              ? key.replace('texts.', '')
                              : key

                            return (
                              <div
                                key={key}
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {displayKey}
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
                                  value={getValue()}
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
