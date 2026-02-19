'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeEditStore } from '@/stores/tree-edits'
import type { TreeNode } from '@/lib/tree/types'
import { DefaultNode, TreasuryNode, SignerNode, BaseNode } from './nodes'
import { ReferenceEdge } from './edges/ReferenceEdge'

const MIN_ZOOM = 0.3
const MAX_ZOOM = 2

type NodeDimensions = {
  width: number
  height: number
}

interface DomainTreeNodeData {
  [key: string]: unknown
  node: TreeNode
  isSelected: boolean
  hasChildren: boolean
  isCollapsed: boolean
  hasPendingEdits: boolean
  childrenCount: number
  orientation: 'vertical' | 'horizontal'
  onToggleCollapse: () => void
}

type DomainTreeNode = Node<DomainTreeNodeData>

const FALLBACK_NODE_SIZES: Record<string, NodeDimensions> = {
  default: { width: 320, height: 220 },
  Treasury: { width: 320, height: 220 },
  Signer: { width: 256, height: 130 },
  BaseNode: { width: 320, height: 220 },
}

const getFlowNodeType = (node: TreeNode): string => {
  const explicitType = (node as any).class || node.texts?.class
  if (explicitType) {
    // Treasury and Signer keep their dedicated components
    if (explicitType === 'Treasury' || explicitType === 'Signer') return explicitType
    // All other schema-typed nodes route to BaseNode
    return 'BaseNode'
  }

  return 'default'
}

const getFallbackNodeSize = (node: TreeNode): NodeDimensions => {
  const flowType = getFlowNodeType(node)
  return FALLBACK_NODE_SIZES[flowType] ?? FALLBACK_NODE_SIZES.default
}

const buildDescendantCountMap = (root: TreeNode) => {
  const counts = new Map<string, number>()

  const count = (node: TreeNode): number => {
    if (!node.children || node.children.length === 0) {
      counts.set(node.name, 0)
      return 0
    }

    const total = node.children.reduce((sum, child) => sum + 1 + count(child), 0)
    counts.set(node.name, total)
    return total
  }

  count(root)
  return counts
}

const layoutTree = (
  root: TreeNode,
  collapsedNodes: Set<string>,
  orientation: 'vertical' | 'horizontal',
  nodeSizes: Map<string, NodeDimensions>,
) => {
  const nodes: Array<Node<TreeNode>> = []
  const edges: Array<Edge> = []
  const layoutEdges: Array<{ source: string; target: string }> = []
  const nodeById = new Map<string, TreeNode>()

  const walk = (node: TreeNode, parentId?: string) => {
    nodeById.set(node.name, node)
    // Use the node's type field if available, otherwise default
    const nodeType = getFlowNodeType(node)
    nodes.push({
      id: node.name,
      type: nodeType,
      position: { x: 0, y: 0 },
      data: node,
    })

    if (parentId) {
      const parentNode = nodeById.get(parentId)
      const isComputedChild = (node as any).isComputed
      const isTreasuryToSigner =
        parentNode &&
        getFlowNodeType(parentNode) === 'Treasury' &&
        getFlowNodeType(node) === 'Signer'

      layoutEdges.push({ source: parentId, target: node.name })
      edges.push({
        id: `edge-${parentId}-${node.name}`,
        source: parentId,
        target: node.name,
        animated: isComputedChild,
        style: isTreasuryToSigner
          ? {
              stroke: '#f59e0b',
              strokeWidth: 2,
            }
          : undefined,
        type: isComputedChild ? 'straight' : 'default',
      })
    }

    // Add edges for computed references (existing nodes)
    const computedRefs = (node as any).inspectionData?.computedReferences
    if (computedRefs && Array.isArray(computedRefs)) {
      for (const refNodeName of computedRefs) {
        layoutEdges.push({ source: node.name, target: refNodeName })
        edges.push({
          id: `edge-ref-${node.name}-${refNodeName}`,
          source: node.name,
          target: refNodeName,
          type: 'reference',
          animated: true,
          data: { sourceLabel: node.name.split('.')[0] },
        })
      }
    }

    if (collapsedNodes.has(node.name)) return

    const sortedChildren = [...(node.children ?? [])].sort((a, b) => a.name.localeCompare(b.name))
    for (const child of sortedChildren) {
      walk(child, node.name)
    }
  }

  walk(root)

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: orientation === 'vertical' ? 'TB' : 'LR',
    nodesep: 80,
    ranksep: 120,
  })

  for (const node of nodes) {
    const size = nodeSizes.get(node.id) ?? getFallbackNodeSize(node.data)
    dagreGraph.setNode(node.id, { width: size.width, height: size.height })
  }

  for (const edge of layoutEdges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const position = dagreGraph.node(node.id)
    const size = nodeSizes.get(node.id) ?? getFallbackNodeSize(node.data)
    return {
      ...node,
      position: {
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
      },
    }
  })

  return { layoutedNodes, edges, nodeById }
}

const nodeTypes = {
  default: DefaultNode,
  Treasury: TreasuryNode,
  Signer: SignerNode,
  BaseNode: BaseNode,
}

const edgeTypes = {
  reference: ReferenceEdge,
}

interface Props {
  data: TreeNode
}

export function Tree({ data }: Props) {
  const {
    selectedNodeName,
    setSelectedNode,
    orientation,
    collapsedNodes,
    toggleNodeCollapsed,
    nodePositions,
    setNodePosition,
    clearNodePositions,
    layoutTrigger,
  } = useTreeControlsStore()
  const { openEditDrawer, hasPendingEdit } = useTreeEditStore()
  const pendingMutationCount = useTreeEditStore((state) => state.pendingMutations.size)
  const [reactFlowInstance, setReactFlowInstance] = useState<
    ReactFlowInstance<DomainTreeNode, Edge> | null
  >(null)
  const [nodeSizes, setNodeSizes] = useState<Map<string, NodeDimensions>>(new Map())

  // Two-pass layout: measuring -> visible (for smooth transitions)
  const [layoutPhase, setLayoutPhase] = useState<'measuring' | 'visible'>('measuring')

  const descendantCounts = useMemo(() => buildDescendantCountMap(data), [data])
  const layout = useMemo(
    () => layoutTree(data, collapsedNodes, orientation, nodeSizes),
    [collapsedNodes, data, nodeSizes, orientation],
  )

  // Reset to measuring phase when data or layout structure changes
  useEffect(() => {
    setLayoutPhase('measuring')
  }, [data, collapsedNodes, orientation])

  const initialNodes = useMemo<DomainTreeNode[]>(() => {
    return layout.layoutedNodes.map((node) => {
      const treeNode = layout.nodeById.get(node.id) ?? node.data

      // Apply custom position if it exists, otherwise use dagre layout position
      const customPosition = nodePositions.get(node.id)
      const position = customPosition || node.position

      const measuredSize = nodeSizes.get(node.id)
      const fallbackSize = getFallbackNodeSize(treeNode)

      return {
        ...node,
        position,
        style: {
          width: measuredSize?.width ?? fallbackSize.width,
          height: measuredSize?.height,
          padding: 0,
          border: 'none',
          background: 'transparent',
          visibility: layoutPhase === 'measuring' ? ('hidden' as const) : ('visible' as const),
        },
        data: {
          node: treeNode,
          isSelected: node.id === selectedNodeName,
          hasChildren: !!treeNode.children?.length,
          isCollapsed: collapsedNodes.has(node.id),
          hasPendingEdits: hasPendingEdit(node.id),
          childrenCount: descendantCounts.get(node.id) ?? 0,
          orientation,
          onToggleCollapse: () => toggleNodeCollapsed(node.id),
        },
      } satisfies DomainTreeNode
    })
  }, [
    collapsedNodes,
    descendantCounts,
    hasPendingEdit,
    layout.layoutedNodes,
    layout.nodeById,
    openEditDrawer,
    orientation,
    pendingMutationCount,
    selectedNodeName,
    setSelectedNode,
    toggleNodeCollapsed,
    nodePositions,
    layoutPhase,
    nodeSizes,
  ])

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<DomainTreeNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges)

  // Custom handler that saves position changes to store
  const onNodesChange = useCallback(
    (changes: NodeChange<DomainTreeNode>[]) => {
      onNodesChangeInternal(changes)

      // Save position changes to store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.dragging === false) {
          setNodePosition(change.id, change.position)
        }
      })
    },
    [onNodesChangeInternal, setNodePosition],
  )

  // Update nodes when layout changes (orientation, collapse, selection, etc)
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Update edges when layout changes
  useEffect(() => {
    setEdges(layout.edges)
  }, [layout.edges, setEdges])

  const areNodeSizesEqual = useCallback(
    (nextSizes: Map<string, NodeDimensions>) => {
      if (nextSizes.size !== nodeSizes.size) return false
      for (const [id, nextSize] of nextSizes.entries()) {
        const currentSize = nodeSizes.get(id)
        if (!currentSize) return false
        if (currentSize.width !== nextSize.width || currentSize.height !== nextSize.height) {
          return false
        }
      }
      return true
    },
    [nodeSizes],
  )

  const escapeSelector = useCallback((value: string) => {
    if (typeof CSS !== 'undefined' && CSS.escape) {
      return CSS.escape(value)
    }
    return value.replace(/["\\]/g, '\\$&')
  }, [])

  // Measure node dimensions after render and re-layout with real sizes
  useEffect(() => {
    if (!reactFlowInstance) return
    if (layoutPhase !== 'measuring') return

    let cancelled = false
    const measure = () => {
      if (cancelled) return

      const nextSizes = new Map<string, NodeDimensions>()
      nodes.forEach((node) => {
        const selector = `.react-flow__node[data-id="${escapeSelector(node.id)}"]`
        const element = document.querySelector(selector)
        if (!element) return
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const zoom = reactFlowInstance.getZoom()
        nextSizes.set(node.id, { width: rect.width / zoom, height: rect.height / zoom })
      })

      if (nextSizes.size > 0 && !areNodeSizesEqual(nextSizes)) {
        setNodeSizes(nextSizes)
      }
      setLayoutPhase('visible')
    }

    const frame = requestAnimationFrame(measure)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [areNodeSizesEqual, escapeSelector, layoutPhase, nodes, reactFlowInstance])

  // Clear custom positions when orientation changes (layout is completely different)
  const prevOrientation = useRef(orientation)
  useEffect(() => {
    if (prevOrientation.current !== orientation) {
      clearNodePositions()
      prevOrientation.current = orientation
    }
  }, [orientation, clearNodePositions])

  // Only fit view after layout is visible (second pass complete)
  useEffect(() => {
    if (layout.layoutedNodes.length === 0) return
    if (!reactFlowInstance) return
    if (layoutPhase !== 'visible') return

    const frame = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.15, maxZoom: 1 })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [reactFlowInstance, orientation, layoutPhase, layout.layoutedNodes.length])

  // Trigger layout recompute when explicitly requested (e.g., after adding computed nodes or inspection data)
  useEffect(() => {
    if (layoutTrigger === 0) return // Skip initial state
    if (!reactFlowInstance) return
    if (layoutPhase !== 'visible') return

    const frame = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.15, maxZoom: 1 })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [layoutTrigger, reactFlowInstance, layoutPhase])

  return (
    <ReactFlow<DomainTreeNode, Edge>
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      fitView={false}
      onNodeClick={(_, node) => {
        setSelectedNode(node.id)
        openEditDrawer(node.id)
      }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        style: { stroke: '#cbd5e1', strokeWidth: 2, opacity: 0.6 },
      }}
      className="h-full w-full"
      onInit={setReactFlowInstance}
    >
      <Background gap={20} size={1} className="bg-white dark:bg-gray-950" />
      <Panel
        position="top-right"
        className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg text-xs font-mono"
      >
        <div className="space-y-1">
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
          <div>Selected: {selectedNodeName || 'None'}</div>
          <div>Orientation: {orientation}</div>
          <div>Collapsed: {collapsedNodes.size}</div>
          {layoutPhase === 'measuring' && (
            <div className="text-amber-600 font-semibold">Computing layout...</div>
          )}
        </div>
      </Panel>
    </ReactFlow>
  )
}
