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
}

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
    const activeSchema = nodeData.schema
      ? schemas.find((s: any) => s.id === nodeData.schema)
      : null

    // Add schema and type to form data ONLY if the node already has a schema
    if (nodeData.schema && activeSchema) {
      nextFormData.schema = activeSchema.id
      nextFormData.type = activeSchema.name
    }

    // Initialize from node data and schema attributes ONLY if node has a schema
    if (nodeData.schema && activeSchema?.attributes) {
      activeSchema.attributes.forEach((attr: any) => {
        const value = nodeData[attr.key] ?? ''
        nextFormData[attr.key] = value

        // Track optional fields that have values
        if (!attr.isRequired && value) {
          optionalFieldsWithValues.add(attr.key)
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
      currentSchemaId: nodeData.schema || null,
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
        type: schema.name,
      }

      // Track optional fields that already have values
      const optionalFieldsWithValues = new Set<string>()

      // Initialize schema attributes
      schema.attributes?.forEach((attr: any) => {
        if (!(attr.key in nextFormData)) {
          const value = nodeData?.[attr.key] ?? ''
          nextFormData[attr.key] = value

          // Track optional fields with existing values
          if (!attr.isRequired && value) {
            optionalFieldsWithValues.add(attr.key)
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
      formData.schema !== originalNode?.schema ||
      formData.type !== originalNode?.type

    // Check schema attributes for changes
    const schemaChanges = activeSchema?.attributes?.some((attr: any) => {
      const currentValue = formData[attr.key] ?? ''
      const originalValue = originalNode?.[attr.key] ?? ''
      return currentValue !== originalValue
    }) ?? false

    // Check extra attributes for changes (including cleared ones)
    const extraChanges = Object.keys(formData).some((key) => {
      // Skip schema and type as we already checked them
      if (key === 'schema' || key === 'type') return false

      const schemaKeys = new Set(activeSchema?.attributes?.map((a: any) => a.key) || [])
      if (schemaKeys.has(key)) return false // Already checked above

      const currentValue = formData[key]
      const originalValue = originalNode?.[key]
      return currentValue !== originalValue
    })

    return schemaTypeChanges || schemaChanges || extraChanges
  },
}))
