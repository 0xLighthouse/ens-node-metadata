import { create } from 'zustand'

export type TreeOrientation = 'vertical' | 'horizontal'
export type TreeViewMode = 'full' | 'compact'

interface TreeControlsState {
  // Selected node
  selectedNodeName: string | null

  // View settings
  orientation: TreeOrientation
  viewMode: TreeViewMode

  // Zoom state
  zoomLevel: number

  // Collapsed nodes (for future expand/collapse feature)
  collapsedNodes: Set<string>

  // Actions
  setSelectedNode: (nodeName: string | null) => void
  setOrientation: (orientation: TreeOrientation) => void
  setViewMode: (viewMode: TreeViewMode) => void
  setZoomLevel: (zoomLevel: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  toggleNodeCollapsed: (nodeName: string) => void
  collapseAll: (nodeNames: string[]) => void
  expandAll: () => void
  reset: () => void
}

const initialState = {
  selectedNodeName: null,
  orientation: 'vertical' as TreeOrientation,
  viewMode: 'full' as TreeViewMode,
  zoomLevel: 1,
  collapsedNodes: new Set<string>(),
}

export const useTreeControlsStore = create<TreeControlsState>()((set, get) => ({
  ...initialState,

  setSelectedNode: (nodeName) => {
    set({ selectedNodeName: nodeName })
  },

  setOrientation: (orientation) => {
    set({ orientation })
  },

  setViewMode: (viewMode) => {
    set({ viewMode })
  },

  setZoomLevel: (zoomLevel) => {
    // Clamp zoom between 0.1 and 3
    const clampedZoom = Math.min(Math.max(zoomLevel, 0.1), 3)
    set({ zoomLevel: clampedZoom })
  },

  zoomIn: () => {
    const { zoomLevel } = get()
    get().setZoomLevel(zoomLevel + 0.2)
  },

  zoomOut: () => {
    const { zoomLevel } = get()
    get().setZoomLevel(zoomLevel - 0.2)
  },

  resetZoom: () => {
    set({ zoomLevel: 1 })
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

  reset: () => {
    set(initialState)
  },
}))
