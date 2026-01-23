/**
 * Tree Controls Store
 *
 * Manages tree visualization state using Zustand with localStorage persistence.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TreeOrientation = 'vertical' | 'horizontal'

export interface NodePosition {
  x: number
  y: number
}

interface TreeControlsState {
  selectedNodeName: string | null

  // View settings
  orientation: TreeOrientation

  // Collapsed nodes
  collapsedNodes: Set<string>

  // Custom node positions (for drag persistence)
  nodePositions: Map<string, NodePosition>

  // Layout recompute trigger
  layoutTrigger: number

  // Actions
  setSelectedNode: (nodeName: string | null) => void
  setOrientation: (orientation: TreeOrientation) => void
  toggleNodeCollapsed: (nodeName: string) => void
  collapseAll: (nodeNames: string[]) => void
  expandAll: () => void
  setNodePosition: (nodeId: string, position: NodePosition) => void
  clearNodePositions: () => void
  triggerLayout: () => void
  reset: () => void
}

const initialState = {
  selectedNodeName: null,
  orientation: 'vertical' as TreeOrientation,
  collapsedNodes: new Set<string>(),
  nodePositions: new Map<string, NodePosition>(),
  layoutTrigger: 0,
}

export const useTreeControlsStore = create<TreeControlsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedNode: (nodeName) => {
        set({ selectedNodeName: nodeName })
      },

      setOrientation: (orientation) => {
        set({ orientation })
      },

      toggleNodeCollapsed: (nodeName) => {
        const { collapsedNodes } = get()
        const newCollapsed = new Set(collapsedNodes)

        if (newCollapsed.has(nodeName)) {
          newCollapsed.delete(nodeName)
        } else {
          newCollapsed.add(nodeName)
        }

        set({ collapsedNodes: newCollapsed })
      },

      collapseAll: (nodeNames) => {
        set({ collapsedNodes: new Set(nodeNames) })
      },

      expandAll: () => {
        set({ collapsedNodes: new Set() })
      },

      setNodePosition: (nodeId, position) => {
        const { nodePositions } = get()
        const newPositions = new Map(nodePositions)
        newPositions.set(nodeId, position)
        set({ nodePositions: newPositions })
      },

      clearNodePositions: () => {
        set({ nodePositions: new Map() })
      },

      triggerLayout: () => {
        set((state) => ({ layoutTrigger: state.layoutTrigger + 1 }))
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'tree-controls-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          return {
            state: {
              ...state,
              collapsedNodes: new Set(state.collapsedNodes || []),
              nodePositions: new Map(Object.entries(state.nodePositions || {})),
            },
          }
        },
        setItem: (name, newValue) => {
          const str = JSON.stringify({
            state: {
              ...newValue.state,
              collapsedNodes: Array.from(newValue.state.collapsedNodes),
              nodePositions: Object.fromEntries(newValue.state.nodePositions),
            },
          })
          localStorage.setItem(name, str)
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        orientation: state.orientation,
        collapsedNodes: state.collapsedNodes,
        nodePositions: state.nodePositions,
        // Don't persist layoutTrigger - it's just a trigger value
      }),
    },
  ),
)
