'use client'

import { ParentSize } from '@visx/responsive'
import { DomainTree } from './DomainTree'
import { TreeControls } from './TreeControls'
import { NodeEditDrawer } from './NodeEditDrawer'
import { ChangesBar } from './ChangesBar'
import { useTreeData } from '@/contexts/TreeDataContext'

export function DomainTreeContainer() {
  const { previewTree } = useTreeData()

  return (
    <>
      <ChangesBar />
      <div className="relative w-full h-[calc(100vh-12rem)] overflow-hidden bg-white dark:bg-gray-950">
        <TreeControls />
        <ParentSize>
          {({ width, height }) => <DomainTree data={previewTree} width={width} height={height} />}
        </ParentSize>
      </div>
      <NodeEditDrawer />
    </>
  )
}
