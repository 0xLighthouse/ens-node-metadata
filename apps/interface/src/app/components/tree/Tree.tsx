'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  Controls,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeEditStore } from '@/stores/tree-edits'
import type { TreeNode } from '@/lib/tree/types'
import { DefaultNode, TreasuryNode, SignerNode } from './nodes'

const NODE_HEIGHT = 100
const NODE_WIDTH = 280
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3

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
) => {
  const nodes: Array<Node<TreeNode>> = []
  const edges: Array<Edge> = []
  const nodeById = new Map<string, TreeNode>()

  const walk = (node: TreeNode, parentId?: string) => {
    nodeById.set(node.name, node)
    // Use the node's type field if available, otherwise default
    const nodeType = (node as any).type || 'default'
    nodes.push({
      id: node.name,
      type: nodeType,
      position: { x: 0, y: 0 },
      data: node,
    })

    if (parentId) {
      const parentNode = nodeById.get(parentId)
      const isComputedChild = (node as any).isComputed
      const isTreasuryToSigner = parentNode && (parentNode as any).type === 'Treasury' && (node as any).type === 'Signer'

      edges.push({
        id: `edge-${parentId}-${node.name}`,
        source: parentId,
        target: node.name,
        animated: isComputedChild,
        style: isTreasuryToSigner ? {
          stroke: '#f59e0b',
          strokeWidth: 2,
        } : undefined,
        type: isComputedChild ? 'straight' : 'default',
      })
    }

    if (collapsedNodes.has(node.name)) return

    for (const child of node.children ?? []) {
      walk(child, node.name)
    }
  }

  walk(root)

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: orientation === 'vertical' ? 'TB' : 'LR',
    nodesep: 32,
    ranksep: 48,
  })

  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const position = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { layoutedNodes, edges, nodeById }
}

const nodeTypes = {
  default: DefaultNode,
  Treasury: TreasuryNode,
  Signer: SignerNode,
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)

  const descendantCounts = useMemo(() => buildDescendantCountMap(data), [data])
  const layout = useMemo(
    () => layoutTree(data, collapsedNodes, orientation),
    [collapsedNodes, data, orientation],
  )

  const initialNodes = useMemo(() => {
    return layout.layoutedNodes.map((node) => {
      const treeNode = layout.nodeById.get(node.id)
      if (!treeNode) return node

      // Apply custom position if it exists, otherwise use dagre layout position
      const customPosition = nodePositions.get(node.id)
      const position = customPosition || node.position

      return {
        ...node,
        position,
        style: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          padding: 0,
          border: 'none',
          background: 'transparent',
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
      }
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
  ])

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges)

  // Custom handler that saves position changes to store
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
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

  // Clear custom positions when orientation changes (layout is completely different)
  const prevOrientation = useRef(orientation)
  useEffect(() => {
    if (prevOrientation.current !== orientation) {
      clearNodePositions()
      prevOrientation.current = orientation
    }
  }, [orientation, clearNodePositions])

  // Only fit view on initial load and orientation changes, not on collapse
  useEffect(() => {
    if (layout.layoutedNodes.length === 0) return
    if (!reactFlowInstance) return

    const frame = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.15, maxZoom: 1 })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [reactFlowInstance, orientation])

  // Trigger layout recompute when explicitly requested (e.g., after adding computed nodes)
  useEffect(() => {
    if (layoutTrigger === 0) return // Skip initial state
    if (!reactFlowInstance) return

    const frame = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.15, maxZoom: 1 })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [layoutTrigger, reactFlowInstance])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
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
      <Controls />
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
        </div>
      </Panel>
    </ReactFlow>
  )
}
