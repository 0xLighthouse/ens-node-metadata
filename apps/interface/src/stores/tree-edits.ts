import { create } from 'zustand'
import type { DomainTreeNode } from '@/lib/tree/types'

export interface TreeMutation {
  id: string
  isCreate: boolean
  // For edits
  nodeName?: string
  changes?: Partial<Omit<DomainTreeNode, 'name' | 'children'>>
  // For creations
  parentName?: string
  nodes?: DomainTreeNode[]
}

interface TreeEditState {
  // Track all changes (edits and creations) by unique ID
  pendingMutations: Map<string, TreeMutation>
  // Currently selected node for editing
  selectedNode: string | null
  // Drawer open state
  isEditDrawerOpen: boolean

  // Actions
  upsertEdit: (nodeName: string, changes: Partial<Omit<DomainTreeNode, 'name' | 'children'>>) => void
  queueCreation: (id: string, parentName: string, nodes: DomainTreeNode[]) => void
  discardPendingMutation: (id: string) => void
  clearPendingMutations: () => void
  setSelectedNode: (nodeName: string | null) => void
  openEditDrawer: (nodeName: string) => void
  closeEditDrawer: () => void
  getPendingEdit: (nodeName: string) => TreeMutation | undefined
  hasPendingEdit: (nodeName: string) => boolean
}

export const useTreeEditStore = create<TreeEditState>((set, get) => ({
  pendingMutations: new Map(),
  selectedNode: null,
  isEditDrawerOpen: false,

  upsertEdit: (nodeName, changes) =>
    set((state) => {
      const newMutations = new Map(state.pendingMutations)

      // Check if this node is part of a pending creation
      let foundInCreation = false
      for (const [id, mutation] of newMutations.entries()) {
        if (mutation.isCreate && mutation.nodes) {
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

          const updatedNodes = updateNodeInTree(mutation.nodes)
          if (foundInCreation) {
            newMutations.set(id, { ...mutation, nodes: updatedNodes })
            return { pendingMutations: newMutations }
          }
        }
      }

      // If not part of a creation, handle as regular edit
      const existingMutation = newMutations.get(nodeName)

      if (existingMutation && !existingMutation.isCreate) {
        // Merge with existing edit
        newMutations.set(nodeName, {
          ...existingMutation,
          changes: { ...existingMutation.changes, ...changes },
        })
      } else {
        // Create new edit
        newMutations.set(nodeName, {
          id: nodeName,
          isCreate: false,
          nodeName,
          changes,
        })
      }
      return { pendingMutations: newMutations }
    }),

  queueCreation: (id, parentName, nodes) =>
    set((state) => {
      const newMutations = new Map(state.pendingMutations)
      newMutations.set(id, {
        id,
        isCreate: true,
        parentName,
        nodes,
      })
      return { pendingMutations: newMutations }
    }),

  discardPendingMutation: (id) =>
    set((state) => {
      const newMutations = new Map(state.pendingMutations)
      newMutations.delete(id)
      return { pendingMutations: newMutations }
    }),

  clearPendingMutations: () => set({ pendingMutations: new Map() }),

  setSelectedNode: (nodeName) => set({ selectedNode: nodeName }),

  openEditDrawer: (nodeName) =>
    set({ isEditDrawerOpen: true, selectedNode: nodeName }),

  closeEditDrawer: () => set({ isEditDrawerOpen: false, selectedNode: null }),

  getPendingEdit: (nodeName) => {
    const mutation = get().pendingMutations.get(nodeName)
    return mutation && !mutation.isCreate ? mutation : undefined
  },

  hasPendingEdit: (nodeName) => {
    const mutation = get().pendingMutations.get(nodeName)
    return !!mutation && !mutation.isCreate
  },
}))
