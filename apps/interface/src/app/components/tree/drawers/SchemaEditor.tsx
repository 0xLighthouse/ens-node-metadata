'use client'

import { useOutsideClick } from '@/hooks/useOutsideClick'
import { useNodeEditorStore } from '@/stores/node-editor'
import { useSchemaStore } from '@/stores/schemas'
import type { Schema } from '@/stores/schemas'
import { ChevronDown, Lock, RefreshCw, Search, Star, Unlock } from 'lucide-react'
import { useRef } from 'react'

/** Fields rendered specially (not in the normal required/optional loops) */
const MANAGED_FIELD_KEYS = new Set(['class', 'schema'])

interface SchemaEditorProps {
  activeSchema: Schema | null
  addressFieldKeys: Set<string>
  onSelectSchema: (schemaId: string) => void
  onRefreshSchemas?: () => Promise<void>
}

export function SchemaEditor({
  activeSchema,
  addressFieldKeys,
  onSelectSchema,
  onRefreshSchemas,
}: SchemaEditorProps) {
  const {
    formData,
    visibleOptionalFields,
    isSchemaDropdownOpen,
    schemaSearchQuery,
    isLoadingSchemas,
    isOptionalFieldDropdownOpen,
    classFieldLocked,
    updateField,
    addOptionalField,
    removeOptionalField,
    toggleSchemaDropdown,
    setSchemaSearchQuery,
    toggleOptionalFieldDropdown,
    toggleClassFieldLock,
  } = useNodeEditorStore()

  const { schemas } = useSchemaStore()

  const schemaDropdownRef = useRef<HTMLDivElement>(null)
  const optionalFieldDropdownRef = useRef<HTMLDivElement>(null)

  useOutsideClick(
    schemaDropdownRef,
    () => { if (isSchemaDropdownOpen) toggleSchemaDropdown() },
    isSchemaDropdownOpen,
  )
  useOutsideClick(
    optionalFieldDropdownRef,
    () => { if (isOptionalFieldDropdownOpen) toggleOptionalFieldDropdown() },
    isOptionalFieldDropdownOpen,
  )

  const filteredSchemas = schemas
    .filter((s) => s.isLatest && s.class != null)
    .filter((s) => s.class.toLowerCase().includes(schemaSearchQuery.toLowerCase()))

  const isExcludedField = (key: string) =>
    addressFieldKeys.has(key) || MANAGED_FIELD_KEYS.has(key)

  const hasNonAddressFields =
    activeSchema?.properties &&
    Object.keys(activeSchema.properties).some((k) => !isExcludedField(k))

  const hasOptionalToAdd =
    activeSchema?.properties &&
    Object.entries(activeSchema.properties).some(
      ([key]) =>
        !isExcludedField(key) &&
        !activeSchema.required?.includes(key) &&
        !activeSchema.recommended?.includes(key) &&
        !visibleOptionalFields.has(key),
    )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      {/* Schema selector header */}
      <div
        className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 relative"
        ref={schemaDropdownRef}
      >
        <button
          type="button"
          onClick={toggleSchemaDropdown}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline transition-colors mb-1"
        >
          <span>
            {activeSchema ? `${activeSchema.class} - v${activeSchema.version}` : '+ Select schema'}
          </span>
          <ChevronDown size={14} />
        </button>
        {activeSchema?.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{activeSchema.description}</p>
        )}

        {isSchemaDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Search schemas…"
                    value={schemaSearchQuery}
                    onChange={(e) => setSchemaSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                {onRefreshSchemas && (
                  <button
                    onClick={onRefreshSchemas}
                    disabled={isLoadingSchemas}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh schemas"
                  >
                    <RefreshCw size={14} className={isLoadingSchemas ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                    onClick={() => onSelectSchema(schema.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      activeSchema?.id === schema.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
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

      {/* class field — always at top when schema is selected, locked by default */}
      {activeSchema && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="schema-class-field"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              class
              <span className="ml-1 text-xs text-gray-400 dark:text-gray-500 font-normal">
                (managed)
              </span>
            </label>
            <button
              type="button"
              onClick={toggleClassFieldLock}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              title={classFieldLocked ? 'Unlock to edit' : 'Lock field'}
              aria-label={classFieldLocked ? 'Unlock class field' : 'Lock class field'}
            >
              {classFieldLocked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          </div>
          <input
            id="schema-class-field"
            type="text"
            value={formData.class ?? activeSchema.class ?? ''}
            onChange={(e) => updateField('class', e.target.value)}
            disabled={classFieldLocked}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-900 dark:text-white transition-colors ${
              classFieldLocked
                ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
                : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            }`}
          />
        </div>
      )}

      {/* Fields */}
      {hasNonAddressFields ? (
        <div className="space-y-4">
          {/* Loop 1: required + recommended fields */}
          {Object.entries(activeSchema!.properties!)
            .filter(
              ([key]) =>
                !isExcludedField(key) &&
                (activeSchema!.required?.includes(key) ||
                  activeSchema!.recommended?.includes(key)),
            )
            .map(([key, attribute]: [string, any]) => {
              const isRequired = activeSchema!.required?.includes(key)
              const isRecommended = !isRequired && activeSchema!.recommended?.includes(key)
              const isTextArea = attribute.type === 'text' || key === 'description'

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                      {isRecommended && (
                        <span title="recommended">
                          <Star size={10} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </span>
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
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white resize-y"
                    />
                  ) : (
                    <input
                      type={attribute.type === 'string' ? 'text' : attribute.type}
                      value={formData[key] ?? ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={attribute.description}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                    />
                  )}
                </div>
              )
            })}

          {/* Loop 2: visible optional fields — rendered just above "Add optional field" */}
          {Object.entries(activeSchema!.properties!)
            .filter(
              ([key]) =>
                !isExcludedField(key) &&
                !activeSchema!.required?.includes(key) &&
                !activeSchema!.recommended?.includes(key) &&
                visibleOptionalFields.has(key),
            )
            .map(([key, attribute]: [string, any]) => {
              const isTextArea = attribute.type === 'text' || key === 'description'

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {key}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionalField(key)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Remove
                    </button>
                  </div>
                  {isTextArea ? (
                    <textarea
                      value={formData[key] ?? ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={attribute.description}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white resize-y"
                    />
                  ) : (
                    <input
                      type={attribute.type === 'string' ? 'text' : attribute.type}
                      value={formData[key] ?? ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={attribute.description}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white"
                    />
                  )}
                </div>
              )
            })}

          {/* Add optional field — size doubled (max-h-96 ≈ 2× the original max-h-48) */}
          {hasOptionalToAdd && (
            <div
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 relative"
              ref={optionalFieldDropdownRef}
            >
              <button
                type="button"
                onClick={toggleOptionalFieldDropdown}
                className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                + Add optional field
              </button>

              {isOptionalFieldDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {Object.entries(activeSchema!.properties!)
                    .filter(
                      ([key]) =>
                        !isExcludedField(key) &&
                        !activeSchema!.required?.includes(key) &&
                        !activeSchema!.recommended?.includes(key) &&
                        !visibleOptionalFields.has(key),
                    )
                    .map(([key, attribute]: [string, any]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => addOptionalField(key)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{key}</div>
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
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p className="text-sm font-medium">No schema selected</p>
          <p className="text-xs mt-1">Select a schema to see available fields</p>
        </div>
      )}
    </div>
  )
}
