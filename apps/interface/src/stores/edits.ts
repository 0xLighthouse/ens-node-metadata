import { create } from 'zustand'
import type { DomainTreeNode } from '@/contexts/DomainTreeContext'

export type NodeEdit = Partial<Omit<DomainTreeNode, 'name' | 'children'>> & {
  nodeName: string
}

interface EditState {
  // Track edits by node name
  pendingEdits: Map<string, NodeEdit>
  // Currently selected node for editing
  selectedNodeForEdit: string | null
  // Drawer open state
  isDrawerOpen: boolean

  // Actions
  addEdit: (nodeName: string, edit: Partial<NodeEdit>) => void
  removeEdit: (nodeName: string) => void
  clearAllEdits: () => void
  setSelectedNodeForEdit: (nodeName: string | null) => void
  openDrawer: (nodeName: string) => void
  closeDrawer: () => void
  getEditForNode: (nodeName: string) => NodeEdit | undefined
}

export const useEditStore = create<EditState>((set, get) => ({
  pendingEdits: new Map(),
  selectedNodeForEdit: null,
  isDrawerOpen: false,

  addEdit: (nodeName, edit) =>
    set((state) => {
      const newEdits = new Map(state.pendingEdits)
      const existingEdit = newEdits.get(nodeName) || { nodeName }
      newEdits.set(nodeName, { ...existingEdit, ...edit })
      return { pendingEdits: newEdits }
    }),

  removeEdit: (nodeName) =>
    set((state) => {
      const newEdits = new Map(state.pendingEdits)
      newEdits.delete(nodeName)
      return { pendingEdits: newEdits }
    }),

  clearAllEdits: () => set({ pendingEdits: new Map() }),

  setSelectedNodeForEdit: (nodeName) => set({ selectedNodeForEdit: nodeName }),

  openDrawer: (nodeName) =>
    set({ isDrawerOpen: true, selectedNodeForEdit: nodeName }),

  closeDrawer: () => set({ isDrawerOpen: false, selectedNodeForEdit: null }),

  getEditForNode: (nodeName) => get().pendingEdits.get(nodeName),
}))
