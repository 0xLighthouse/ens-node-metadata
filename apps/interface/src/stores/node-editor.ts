import { create } from 'zustand'

type NodeEditFormData = Record<string, any>

interface NodeEditorState {
  // Form state
  formData: NodeEditFormData
  currentSchemaId: string | null
  visibleOptionalFields: Set<string>

  // Custom attribute state
  isAddingCustomAttribute: boolean
  newAttributeKey: string

  // Schema dropdown state
  isSchemaDropdownOpen: boolean
  schemaSearchQuery: string
  isLoadingSchemas: boolean

  // Optional field dropdown state
  isOptionalFieldDropdownOpen: boolean

  // Actions
  initializeEditor: (
    nodeData: any,
    existingEdit: any,
    schemas: any[]
  ) => void
  resetEditor: () => void
  updateField: (key: string, value: any) => void
  setCurrentSchema: (schemaId: string, schema: any, nodeData?: any) => void
  addOptionalField: (fieldKey: string) => void
  removeOptionalField: (fieldKey: string) => void
  toggleSchemaDropdown: () => void
  setSchemaSearchQuery: (query: string) => void
  setIsLoadingSchemas: (isLoading: boolean) => void
  toggleOptionalFieldDropdown: () => void
  setIsAddingCustomAttribute: (isAdding: boolean) => void
  setNewAttributeKey: (key: string) => void
  addCustomAttribute: (key: string) => void
  removeCustomAttribute: (key: string) => void
  getFormData: () => NodeEditFormData
  hasChanges: (originalNode: any, activeSchema: any) => boolean
  getChangedFields: (originalNode: any, activeSchema: any) => { changes: Record<string, any>; deleted: string[] }
}

// Resolve a value: check top-level first (pending edit merges), then node.texts
const resolveNodeValue = (node: any, key: string) =>
  node?.[key] !== undefined ? node[key] : node?.texts?.[key]

const initialState = {
  formData: {},
  currentSchemaId: null,
  visibleOptionalFields: new Set<string>(),
  isAddingCustomAttribute: false,
  newAttributeKey: '',
  isSchemaDropdownOpen: false,
  schemaSearchQuery: '',
  isLoadingSchemas: false,
  isOptionalFieldDropdownOpen: false,
}

export const useNodeEditorStore = create<NodeEditorState>((set, get) => ({
  ...initialState,

  initializeEditor: (nodeData, existingEdit, schemas) => {
    const nextFormData: NodeEditFormData = {}
    const optionalFieldsWithValues = new Set<string>()

    // Look up the active schema based on the node's schema property
    const nodeSchemaId = resolveNodeValue(nodeData, 'schema')
    const activeSchema = nodeSchemaId
      ? schemas.find((s: any) => s.id === nodeSchemaId)
      : null

    // Add schema and type to form data ONLY if the node already has a schema
    if (nodeSchemaId && activeSchema) {
      nextFormData.schema = activeSchema.id
      nextFormData.class = activeSchema.class
    }

    // Initialize from node data and schema properties ONLY if node has a schema
    if (nodeSchemaId && activeSchema?.properties) {
      Object.entries(activeSchema.properties).forEach(([key, prop]: [string, any]) => {
        const value = resolveNodeValue(nodeData, key) ?? ''
        nextFormData[key] = value

        // Track optional fields that have values or are recommended
        const isRecommended = activeSchema.recommended?.includes(key)
        if (!activeSchema.required?.includes(key) && (value || isRecommended)) {
          optionalFieldsWithValues.add(key)
        }
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

    set({
      formData: nextFormData,
      currentSchemaId: nodeSchemaId || null,
      visibleOptionalFields: optionalFieldsWithValues,
      isAddingCustomAttribute: false,
      newAttributeKey: '',
      isSchemaDropdownOpen: false,
      schemaSearchQuery: '',
      isOptionalFieldDropdownOpen: false,
    })
  },

  resetEditor: () => set(initialState),

  updateField: (key, value) =>
    set((state) => ({
      formData: { ...state.formData, [key]: value },
    })),

  setCurrentSchema: (schemaId, schema, nodeData) =>
    set((state) => {
      const nextFormData: NodeEditFormData = {
        ...state.formData,
        schema: schema.id,
        class: schema.class,
      }

      // Track optional fields that already have values
      const optionalFieldsWithValues = new Set<string>()

      // Initialize schema properties
      Object.entries(schema.properties ?? {}).forEach(([key, prop]: [string, any]) => {
        if (!(key in nextFormData)) {
          const value = resolveNodeValue(nodeData, key) ?? ''
          nextFormData[key] = value

          // Track optional fields with existing values or that are recommended
          const isRecommended = schema.recommended?.includes(key)
          if (!schema.required?.includes(key) && (value || isRecommended)) {
            optionalFieldsWithValues.add(key)
          }
        }
      })

      return {
        currentSchemaId: schemaId,
        formData: nextFormData,
        visibleOptionalFields: optionalFieldsWithValues,
        isSchemaDropdownOpen: false,
        schemaSearchQuery: '',
      }
    }),

  addOptionalField: (fieldKey) =>
    set((state) => ({
      visibleOptionalFields: new Set(state.visibleOptionalFields).add(fieldKey),
      isOptionalFieldDropdownOpen: false,
    })),

  removeOptionalField: (fieldKey) =>
    set((state) => {
      const nextOptionalFields = new Set(state.visibleOptionalFields)
      nextOptionalFields.delete(fieldKey)
      const nextFormData = { ...state.formData }
      delete nextFormData[fieldKey]
      return {
        visibleOptionalFields: nextOptionalFields,
        formData: nextFormData,
      }
    }),

  toggleSchemaDropdown: () =>
    set((state) => ({
      isSchemaDropdownOpen: !state.isSchemaDropdownOpen,
      schemaSearchQuery: state.isSchemaDropdownOpen ? '' : state.schemaSearchQuery,
    })),

  setSchemaSearchQuery: (query) => set({ schemaSearchQuery: query }),

  setIsLoadingSchemas: (isLoading) => set({ isLoadingSchemas: isLoading }),

  toggleOptionalFieldDropdown: () =>
    set((state) => ({
      isOptionalFieldDropdownOpen: !state.isOptionalFieldDropdownOpen,
    })),

  setIsAddingCustomAttribute: (isAdding) =>
    set({ isAddingCustomAttribute: isAdding, newAttributeKey: isAdding ? '' : get().newAttributeKey }),

  setNewAttributeKey: (key) => set({ newAttributeKey: key }),

  addCustomAttribute: (key) =>
    set((state) => ({
      formData: { ...state.formData, [key]: '' },
      newAttributeKey: '',
      isAddingCustomAttribute: false,
    })),

  removeCustomAttribute: (key) =>
    set((state) => ({
      formData: { ...state.formData, [key]: null },
    })),

  getFormData: () => get().formData,

  hasChanges: (originalNode, activeSchema) => {
    const { formData } = get()

    // Check schema and type changes
    const schemaTypeChanges =
      formData.schema !== resolveNodeValue(originalNode, 'schema') ||
      formData.class !== resolveNodeValue(originalNode, 'class')

    // Check schema properties for changes
    const schemaChanges = Object.entries(activeSchema?.properties ?? {}).some(([key]) => {
      const currentValue = formData[key] ?? ''
      const originalValue = resolveNodeValue(originalNode, key) ?? ''
      return currentValue !== originalValue
    })

    // Check extra text records for changes (including cleared ones)
    const extraChanges = Object.keys(formData).some((key) => {
      // Skip schema and type as we already checked them
      if (key === 'schema' || key === 'class') return false

      const schemaKeys = new Set(Object.keys(activeSchema?.properties ?? {}))
      if (schemaKeys.has(key)) return false // Already checked above

      const currentValue = formData[key]
      const originalValue = resolveNodeValue(originalNode, key)
      return currentValue !== originalValue
    })

    return schemaTypeChanges || schemaChanges || extraChanges
  },

  getChangedFields: (originalNode, activeSchema) => {
    const { formData } = get()
    const changes: Record<string, any> = {}
    const deleted: string[] = []
    const isEmpty = (v: any) => v === '' || v === null || v === undefined

    for (const [key, value] of Object.entries(formData)) {
      const original = resolveNodeValue(originalNode, key)
      if (isEmpty(value) && isEmpty(original)) continue
      if (value === original) continue

      if (isEmpty(value) && !isEmpty(original)) {
        deleted.push(key)
      } else {
        changes[key] = value
      }
    }

    return { changes, deleted }
  },
}))
