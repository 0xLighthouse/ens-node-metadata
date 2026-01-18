import { create } from 'zustand'
import type { DomainTreeNode } from '@/contexts/TreeDataContext'

export interface NodeChange {
  id: string
  isCreate: boolean
  // For edits
  nodeName?: string
  changes?: Partial<Omit<DomainTreeNode, 'name' | 'children'>>
  // For creations
  parentName?: string
  nodes?: DomainTreeNode[]
}

interface EditState {
  // Track all changes (edits and creations) by unique ID
  pendingChanges: Map<string, NodeChange>
  // Currently selected node for editing
  selectedNodeForEdit: string | null
  // Drawer open state
  isDrawerOpen: boolean

  // Actions
  addEdit: (nodeName: string, changes: Partial<Omit<DomainTreeNode, 'name' | 'children'>>) => void
  addCreation: (id: string, parentName: string, nodes: DomainTreeNode[]) => void
  removeChange: (id: string) => void
  clearAllChanges: () => void
  setSelectedNodeForEdit: (nodeName: string | null) => void
  openDrawer: (nodeName: string) => void
  closeDrawer: () => void
  getEditForNode: (nodeName: string) => NodeChange | undefined
  hasEditForNode: (nodeName: string) => boolean
}

export const useEditStore = create<EditState>((set, get) => ({
  pendingChanges: new Map(),
  selectedNodeForEdit: null,
  isDrawerOpen: false,

  addEdit: (nodeName, changes) =>
    set((state) => {
      const newChanges = new Map(state.pendingChanges)

      // Check if this node is part of a pending creation
      let foundInCreation = false
      for (const [id, change] of newChanges.entries()) {
        if (change.isCreate && change.nodes) {
          // Helper to find and update node in tree
          const updateNodeInTree = (nodes: any[]): any[] => {
            return nodes.map((node) => {
              if (node.name === nodeName) {
                foundInCreation = true
                return { ...node, ...changes }
              }
              if (node.children) {
                return { ...node, children: updateNodeInTree(node.children) }
              }
              return node
            })
          }

          const updatedNodes = updateNodeInTree(change.nodes)
          if (foundInCreation) {
            newChanges.set(id, { ...change, nodes: updatedNodes })
            return { pendingChanges: newChanges }
          }
        }
      }

      // If not part of a creation, handle as regular edit
      const existingChange = newChanges.get(nodeName)

      if (existingChange && !existingChange.isCreate) {
        // Merge with existing edit
        newChanges.set(nodeName, {
          ...existingChange,
          changes: { ...existingChange.changes, ...changes },
        })
      } else {
        // Create new edit
        newChanges.set(nodeName, {
          id: nodeName,
          isCreate: false,
          nodeName,
          changes,
        })
      }
      return { pendingChanges: newChanges }
    }),

  addCreation: (id, parentName, nodes) =>
    set((state) => {
      const newChanges = new Map(state.pendingChanges)
      newChanges.set(id, {
        id,
        isCreate: true,
        parentName,
        nodes,
      })
      return { pendingChanges: newChanges }
    }),

  removeChange: (id) =>
    set((state) => {
      const newChanges = new Map(state.pendingChanges)
      newChanges.delete(id)
      return { pendingChanges: newChanges }
    }),

  clearAllChanges: () => set({ pendingChanges: new Map() }),

  setSelectedNodeForEdit: (nodeName) => set({ selectedNodeForEdit: nodeName }),

  openDrawer: (nodeName) =>
    set({ isDrawerOpen: true, selectedNodeForEdit: nodeName }),

  closeDrawer: () => set({ isDrawerOpen: false, selectedNodeForEdit: null }),

  getEditForNode: (nodeName) => {
    const change = get().pendingChanges.get(nodeName)
    return change && !change.isCreate ? change : undefined
  },

  hasEditForNode: (nodeName) => {
    const change = get().pendingChanges.get(nodeName)
    return !!change && !change.isCreate
  },
}))
