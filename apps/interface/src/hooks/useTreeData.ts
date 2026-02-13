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
   * The tree data that is displayed to the user, including pending creations and edits.
   * This is used to render the tree in the UI.
   */
  const previewTree = useMemo(() => {
    if (!sourceTree) return null

    const markAsPending = (node: TreeNodes): TreeNodes => ({
      ...node,
      isPendingCreation: true,
      children: node.children?.map(markAsPending),
    })

    const mergePendingChanges = (node: TreeNodes): TreeNodes => {
      // Apply any pending edits to this node
      const pendingEdit = Array.from(pendingMutations.values()).find(
        (change) => !change.isCreate && change.nodeName === node.name,
      )

      let mergedNode = { ...node }
      if (pendingEdit?.changes) {
        mergedNode = { ...mergedNode, ...pendingEdit.changes }
      }

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

      // Add computed children from inspection data (e.g., signers from Safe multisig)
      const computedChildren = mergedNode.inspectionData?.computedChildren || []

      // Recursively process existing children
      const processedChildren = node.children?.map(mergePendingChanges) || []

      // Combine existing children with pending nodes and computed nodes
      const allChildren = [...processedChildren, ...nodesToAdd, ...computedChildren]

      return {
        ...mergedNode,
        children: allChildren.length > 0 ? allChildren : undefined,
      }
    }

    return mergePendingChanges(sourceTree)
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
