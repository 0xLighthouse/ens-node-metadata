'use client'

import { Group } from '@visx/group'
import { Tree, hierarchy } from '@visx/hierarchy'
import { LinkHorizontal, LinkVertical } from '@visx/shape'
import { LinearGradient } from '@visx/gradient'
import { Zoom } from '@visx/zoom'
import type { ProvidedZoom } from '@visx/zoom/lib/types'
import type { HierarchyPointNode } from '@visx/hierarchy/lib/types'
import { type DomainTreeNode } from '@/contexts/TreeDataContext'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeEditStore } from '@/stores/tree-edits'
import { DomainTreeNodeCard } from './DomainTreeNode'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

interface DomainTreeProps {
  data: DomainTreeNode
  width: number
  height: number
}

const defaultMargin = { top: 80, left: 60, right: 60, bottom: 80 }
const minScale = 0.1
const maxScale = 3

interface LayoutBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const clampScale = (scale: number) => Math.min(Math.max(scale, minScale), maxScale)

const getBoundsKey = (bounds: LayoutBounds) =>
  `${bounds.minX.toFixed(2)}:${bounds.maxX.toFixed(2)}:${bounds.minY.toFixed(2)}:${bounds.maxY.toFixed(2)}`

const countDescendants = (node: HierarchyPointNode<DomainTreeNode>): number => {
  if (!node.children || node.children.length === 0) return 0
  return node.children.reduce((count, child) => count + 1 + countDescendants(child), 0)
}

const getNodePoint = (
  node: HierarchyPointNode<DomainTreeNode>,
  isVertical: boolean
) => ({
  x: isVertical ? node.x : node.y,
  y: isVertical ? node.y : node.x,
})

const getTreeBounds = (
  nodes: HierarchyPointNode<DomainTreeNode>[],
  cardWidth: number,
  cardHeight: number,
  isVertical: boolean
): LayoutBounds | null => {
  if (nodes.length === 0) return null

  const halfWidth = cardWidth / 2
  const halfHeight = cardHeight / 2
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const { x, y } = getNodePoint(node, isVertical)
    minX = Math.min(minX, x - halfWidth)
    maxX = Math.max(maxX, x + halfWidth)
    minY = Math.min(minY, y - halfHeight)
    maxY = Math.max(maxY, y + halfHeight)
  })

  return { minX, maxX, minY, maxY }
}

const getFitTransform = (
  bounds: LayoutBounds,
  width: number,
  height: number,
  padding: number,
  zoomLevel: number
) => {
  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1)
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1)
  const paddedWidth = contentWidth + padding * 2
  const paddedHeight = contentHeight + padding * 2

  const fitScale = Math.min(width / paddedWidth, height / paddedHeight)
  const scale = clampScale(fitScale * zoomLevel)
  const translateX = (width - contentWidth * scale) / 2 - bounds.minX * scale
  const translateY = (height - contentHeight * scale) / 2 - bounds.minY * scale

  return { scale, translateX, translateY }
}

export function DomainTree({ data, width, height }: DomainTreeProps) {
  const {
    selectedNodeName,
    setSelectedNode,
    orientation,
    viewMode,
    collapsedNodes,
    toggleNodeCollapsed,
    zoomLevel,
  } = useTreeControlsStore()

  const { openEditDrawer, hasPendingEdit } = useTreeEditStore()

  const zoomRef = useRef<ProvidedZoom<SVGSVGElement> | null>(null)
  const [layoutBounds, setLayoutBounds] = useState<LayoutBounds | null>(null)
  const lastBoundsKey = useRef<string>('')

  const isVertical = orientation === 'vertical'
  const isCompact = viewMode === 'compact'

  // Memoize hierarchy creation (following visx reference)
  const root = useMemo(() => hierarchy<DomainTreeNode>(data), [data])

  const innerWidth = width - defaultMargin.left - defaultMargin.right
  const innerHeight = height - defaultMargin.top - defaultMargin.bottom

  // Card dimensions that affect tree packing
  const cardWidth = isCompact ? 200 : 280
  const cardHeight = 100

  // Node spacing based on card size plus minimal padding
  const nodeSpacingX = cardWidth + (isCompact ? 24 : 32)
  const nodeSpacingY = cardHeight + (isCompact ? 36 : 48)
  const fitPadding = isCompact ? 24 : 36

  const handleLayout = useCallback((bounds: LayoutBounds) => {
    const nextKey = getBoundsKey(bounds)
    if (nextKey === lastBoundsKey.current) return
    lastBoundsKey.current = nextKey
    setLayoutBounds(bounds)
  }, [])

  useLayoutEffect(() => {
    if (!zoomRef.current || !layoutBounds) return
    if (innerWidth <= 0 || innerHeight <= 0) return

    // Fit and center the visible tree bounds while respecting the current zoom level.
    const { scale, translateX, translateY } = getFitTransform(
      layoutBounds,
      innerWidth,
      innerHeight,
      fitPadding,
      zoomLevel
    )

    zoomRef.current.setTransformMatrix({
      scaleX: scale,
      scaleY: scale,
      translateX,
      translateY,
      skewX: 0,
      skewY: 0,
    })
  }, [fitPadding, innerHeight, innerWidth, layoutBounds, zoomLevel])

  return (
    <div className="relative w-full h-full">
      <Zoom<SVGSVGElement>
        width={width}
        height={height}
        scaleXMin={minScale}
        scaleXMax={maxScale}
        scaleYMin={minScale}
        scaleYMax={maxScale}
        initialTransformMatrix={{
          scaleX: 1,
          scaleY: 1,
          translateX: 0,
          translateY: 0,
          skewX: 0,
          skewY: 0,
        }}
      >
        {(zoom) => {
          zoomRef.current = zoom

          return (
            <svg
              width={width}
              height={height}
              style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab', display: 'block' }}
              ref={zoom.containerRef}
            >
              <LinearGradient id="tree-gradient" from="#4F46E5" to="#9333EA" />
              <rect width={width} height={height} fill="transparent" stroke="none" />
              <Group
                top={defaultMargin.top}
                left={defaultMargin.left}
                transform={zoom.toString()}
              >
                <Tree<DomainTreeNode>
                  root={root}
                  nodeSize={isVertical ? [nodeSpacingX, nodeSpacingY] : [nodeSpacingY, nodeSpacingX]}
                  separation={(a, b) => (a.parent === b.parent ? 1 : 1.2)}
                >
                  {(tree) => (
                    <TreeLayer
                      tree={tree}
                      isVertical={isVertical}
                      isCompact={isCompact}
                      cardWidth={cardWidth}
                      cardHeight={cardHeight}
                      selectedNodeName={selectedNodeName}
                      collapsedNodes={collapsedNodes}
                      hasPendingEdit={hasPendingEdit}
                      onSelectNode={(nodeName) => {
                        setSelectedNode(nodeName)
                        openEditDrawer(nodeName)
                      }}
                      onToggleCollapse={toggleNodeCollapsed}
                      onLayout={handleLayout}
                    />
                  )}
                </Tree>
              </Group>
            </svg>
          )
        }}
      </Zoom>
    </div>
  )
}

interface TreeLayerProps {
  tree: HierarchyPointNode<DomainTreeNode>
  isVertical: boolean
  isCompact: boolean
  cardWidth: number
  cardHeight: number
  selectedNodeName: string | null
  collapsedNodes: Set<string>
  hasPendingEdit: (nodeName: string) => boolean
  onSelectNode: (nodeName: string) => void
  onToggleCollapse: (nodeName: string) => void
  onLayout: (bounds: LayoutBounds) => void
}

function TreeLayer({
  tree,
  isVertical,
  isCompact,
  cardWidth,
  cardHeight,
  selectedNodeName,
  collapsedNodes,
  hasPendingEdit,
  onSelectNode,
  onToggleCollapse,
  onLayout,
}: TreeLayerProps) {
  const isNodeVisible = useCallback(
    (node: HierarchyPointNode<DomainTreeNode>): boolean => {
      let current = node.parent
      while (current) {
        if (collapsedNodes.has(current.data.name)) {
          return false
        }
        current = current.parent
      }
      return true
    },
    [collapsedNodes]
  )

  const visibleNodes = useMemo(
    () => tree.descendants().filter(isNodeVisible),
    [tree, isNodeVisible]
  )
  const visibleLinks = useMemo(
    () =>
      tree.links().filter(
        (link) => isNodeVisible(link.source) && isNodeVisible(link.target)
      ),
    [tree, isNodeVisible]
  )

  const layoutBounds = useMemo(
    () => getTreeBounds(visibleNodes, cardWidth, cardHeight, isVertical),
    [cardHeight, cardWidth, isVertical, visibleNodes]
  )

  useLayoutEffect(() => {
    if (!layoutBounds) return
    onLayout(layoutBounds)
  }, [layoutBounds, onLayout])

  const linkX = useCallback(
    (node: HierarchyPointNode<DomainTreeNode>) => (isVertical ? node.x : node.y),
    [isVertical]
  )
  const linkY = useCallback(
    (node: HierarchyPointNode<DomainTreeNode>) => (isVertical ? node.y : node.x),
    [isVertical]
  )

  const LinkComponent = isVertical ? LinkVertical : LinkHorizontal

  return (
    <Group>
      {visibleLinks.map((link, i) => (
        <LinkComponent
          key={`link-${i}`}
          data={link}
          x={linkX}
          y={linkY}
          stroke="#cbd5e1"
          strokeWidth="2"
          fill="none"
          strokeOpacity={0.6}
        />
      ))}
      {visibleNodes.map((node, i) => (
        <NodeComponent
          key={`node-${i}`}
          node={node}
          isVertical={isVertical}
          isCompact={isCompact}
          cardWidth={cardWidth}
          cardHeight={cardHeight}
          isSelected={node.data.name === selectedNodeName}
          isCollapsed={collapsedNodes.has(node.data.name)}
          hasPendingEdits={hasPendingEdit(node.data.name)}
          childrenCount={countDescendants(node)}
          onClick={() => onSelectNode(node.data.name)}
          onToggleCollapse={() => onToggleCollapse(node.data.name)}
        />
      ))}
    </Group>
  )
}

interface NodeProps {
  node: HierarchyPointNode<DomainTreeNode>
  isVertical: boolean
  isCompact: boolean
  cardWidth: number
  cardHeight: number
  isSelected: boolean
  isCollapsed: boolean
  hasPendingEdits: boolean
  childrenCount: number
  onClick: () => void
  onToggleCollapse: () => void
}

function NodeComponent({
  node,
  isVertical,
  isCompact,
  cardWidth,
  cardHeight,
  isSelected,
  isCollapsed,
  hasPendingEdits,
  childrenCount,
  onClick,
  onToggleCollapse,
}: NodeProps) {
  const top = isVertical ? node.y : node.x
  const left = isVertical ? node.x : node.y

  const hasChildren = node.children && node.children.length > 0

  // Offset to center the card on the node position
  const offsetX = -cardWidth / 2
  const offsetY = -cardHeight / 2

  return (
    <Group top={top} left={left}>
      <foreignObject
        x={offsetX}
        y={offsetY}
        width={cardWidth}
        height={cardHeight}
        style={{ overflow: 'visible' }}
      >
        <DomainTreeNodeCard
          node={node.data}
          isSelected={isSelected}
          onClick={onClick}
          isCompact={isCompact}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          hasPendingEdits={hasPendingEdits}
          childrenCount={childrenCount}
          onToggleCollapse={onToggleCollapse}
        />
      </foreignObject>
    </Group>
  )
}
