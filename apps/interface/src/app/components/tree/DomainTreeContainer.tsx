'use client'

import { ParentSize } from '@visx/responsive'
import { DomainTree } from './DomainTree'
import { TreeControls } from './TreeControls'
import { NodeEditDrawer } from './NodeEditDrawer'
import { ChangesBar } from './ChangesBar'
import { useDomainTree } from '@/contexts/DomainTreeContext'

export function DomainTreeContainer() {
  const { tree } = useDomainTree()

  return (
    <>
      <ChangesBar />
      <div className="relative w-full h-[800px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <TreeControls />
        <ParentSize>
          {({ width, height }) => <DomainTree data={tree} width={width} height={height} />}
        </ParentSize>
      </div>
      <NodeEditDrawer />
    </>
  )
}
