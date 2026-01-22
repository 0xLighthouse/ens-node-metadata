import { useCallback, useMemo } from 'react'
import { useTreeLoaderStore } from '@/stores/tree-loader'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useAppStore } from '@/stores/app'
import type { TreeNodes } from '@/lib/tree/types'

export const useTreeData = () => {
  const {
    sourceTree: cachedTree,
    treeRootName: cachedRootName,
    lastFetchedAt,
    isLoading,
    isRefreshing,
    hasHydrated,
    loadTree,
    refreshTree,
    setTree,
  } = useTreeLoaderStore()
  const { activeDomain } = useAppStore()
  const { pendingMutations } = useTreeEditStore()

  const activeRootName = activeDomain?.name
  const isActiveTree = !!activeRootName && cachedRootName === activeRootName
  const sourceTree = isActiveTree ? cachedTree : null
  const lastFetchedAtForActiveDomain = isActiveTree ? lastFetchedAt : null

  const loadTreeForRoot = useCallback(async () => {
    if (!activeRootName) return
    await loadTree(activeRootName)
  }, [loadTree, activeRootName])

  const refreshTreeForRoot = useCallback(async () => {
    if (!activeRootName) return
    await refreshTree(activeRootName)
  }, [refreshTree, activeRootName])

  const addNodesToParent = useCallback(
    (parentName: string, newNodes: TreeNodes[]) => {
      if (!isActiveTree || !sourceTree) return

      const addNodes = (node: TreeNodes): TreeNodes => {
        if (node.name === parentName) {
          return {
            ...node,
            children: [...(node.children || []), ...newNodes],
          }
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(addNodes),
          }
        }
        return node
      }

      setTree(addNodes(sourceTree))
    },
    [isActiveTree, setTree, sourceTree],
  )

  /**
   * The tree data that is displayed to the user, including pending creations.
   * This is used to render the tree in the UI.
   */
  const previewTree = useMemo(() => {
    if (!sourceTree) return null

    const markAsPending = (node: TreeNodes): TreeNodes => ({
      ...node,
      isPendingCreation: true,
      children: node.children?.map(markAsPending),
    })

    const mergePendingCreations = (node: TreeNodes): TreeNodes => {
      // Find any pending creations for this node
      const creationsForThisNode = Array.from(pendingMutations.values()).filter(
        (change) => change.isCreate && change.parentName === node.name,
      )

      // Collect all nodes to add from creations
      const nodesToAdd: TreeNodes[] = []
      for (const creation of creationsForThisNode) {
        if (creation.nodes) {
          const markedNodes = creation.nodes.map((n) => ({
            ...n,
            isPendingCreation: true,
            // Recursively mark children as pending too
            children: n.children?.map(markAsPending),
          }))
          nodesToAdd.push(...markedNodes)
        }
      }

      // Recursively process existing children
      const processedChildren = node.children?.map(mergePendingCreations) || []

      // Combine existing children with new pending nodes
      const allChildren = [...processedChildren, ...nodesToAdd]

      return {
        ...node,
        children: allChildren.length > 0 ? allChildren : undefined,
      }
    }

    return mergePendingCreations(sourceTree)
  }, [sourceTree, pendingMutations])

  return {
    sourceTree,
    previewTree,
    lastFetchedAt: lastFetchedAtForActiveDomain,
    isLoading,
    isRefreshing,
    hasHydrated,
    loadTree: loadTreeForRoot,
    refreshTree: refreshTreeForRoot,
    addNodesToParent
  }
}
