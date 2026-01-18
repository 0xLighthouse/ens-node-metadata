'use client'

import { Group } from '@visx/group'
import { Tree, hierarchy } from '@visx/hierarchy'
import { LinkVertical } from '@visx/shape'
import { LinearGradient } from '@visx/gradient'
import { Zoom } from '@visx/zoom'
import type { ProvidedZoom } from '@visx/zoom/lib/types'
import type { HierarchyPointNode } from '@visx/hierarchy/lib/types'
import { type DomainTreeNode } from '@/contexts/DomainTreeContext'
import { useTreeStore } from '@/stores/tree'
import { useEditStore } from '@/stores/edits'
import { DomainTreeNodeCard } from './DomainTreeNode'
import { useEffect, useRef, useMemo } from 'react'

interface DomainTreeProps {
  data: DomainTreeNode
  width: number
  height: number
}

const defaultMargin = { top: 80, left: 60, right: 60, bottom: 80 }

export function DomainTree({ data, width, height }: DomainTreeProps) {
  const {
    selectedNodeName,
    setSelectedNode,
    orientation,
    viewMode,
    collapsedNodes,
    toggleNodeCollapsed,
    zoomLevel,
  } = useTreeStore()

  const { openDrawer, hasEditForNode } = useEditStore()

  const zoomRef = useRef<ProvidedZoom<SVGSVGElement> | null>(null)

  const isVertical = orientation === 'vertical'
  const isCompact = viewMode === 'compact'

  // Memoize hierarchy creation (following visx reference)
  const root = useMemo(() => hierarchy<DomainTreeNode>(data), [data])

  const innerWidth = width - defaultMargin.left - defaultMargin.right
  const innerHeight = height - defaultMargin.top - defaultMargin.bottom

  const yMax = innerHeight
  const xMax = innerWidth

  // Card dimensions that affect tree packing
  const cardWidth = isCompact ? 200 : 280
  const cardHeight = 100

  // Node spacing based on card size plus minimal padding
  const nodeSpacingX = cardWidth + 40
  const nodeSpacingY = cardHeight + 60

  // Sync zoom level from store to visx zoom
  useEffect(() => {
    if (zoomRef.current) {
      zoomRef.current.scale({ scaleX: zoomLevel * 0.7, scaleY: zoomLevel * 0.7 })
    }
  }, [zoomLevel])

  // Helper to check if a node should be visible (not a child of a collapsed node)
  const isNodeVisible = (node: HierarchyPointNode<DomainTreeNode>): boolean => {
    let current = node.parent
    while (current) {
      if (collapsedNodes.has(current.data.name)) {
        return false
      }
      current = current.parent
    }
    return true
  }

  // Helper to count all descendants of a node
  const countDescendants = (node: HierarchyPointNode<DomainTreeNode>): number => {
    if (!node.children || node.children.length === 0) return 0
    return node.children.reduce(
      (count, child) => count + 1 + countDescendants(child),
      0
    )
  }

  return (
    <div className="relative w-full h-full">
      <Zoom<SVGSVGElement>
        width={width}
        height={height}
        scaleXMin={0.1}
        scaleXMax={4}
        scaleYMin={0.1}
        scaleYMax={4}
        initialTransformMatrix={{
          scaleX: 0.7,
          scaleY: 0.7,
          translateX: isVertical ? width * 0.15 : width * 0.1,
          translateY: height * 0.05,
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
                  {(tree) => {
                    const visibleNodes = tree.descendants().filter(isNodeVisible)
                    const visibleLinks = tree.links().filter(
                      (link) => isNodeVisible(link.source) && isNodeVisible(link.target)
                    )

                    return (
                      <Group>
                        {visibleLinks.map((link, i) => (
                          <LinkVertical
                            key={`link-${i}`}
                            data={link}
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
                            hasPendingEdits={hasEditForNode(node.data.name)}
                            childrenCount={countDescendants(node)}
                            onClick={() => {
                              setSelectedNode(node.data.name)
                              openDrawer(node.data.name)
                            }}
                            onToggleCollapse={() => toggleNodeCollapsed(node.data.name)}
                          />
                        ))}
                      </Group>
                    )
                  }}
                </Tree>
              </Group>
            </svg>
          )
        }}
      </Zoom>
    </div>
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
