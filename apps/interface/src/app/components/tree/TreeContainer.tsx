'use client'

import { useEffect } from 'react'
import { ParentSize } from '@visx/responsive'
import { DomainTree } from './DomainTree'
import { TreeControls } from './TreeControls'
import { NodeEditDrawer } from './NodeEditDrawer'
import { ChangesBar } from './ChangesBar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTreeData } from '@/hooks/useTreeData'

export function TreeContainer() {
  const { previewTree, isLoading, hasHydrated, loadTree } = useTreeData()

  useEffect(() => {
    if (!hasHydrated) return
    void loadTree()
  }, [hasHydrated, loadTree])

  const showLoader = isLoading || !previewTree

  return (
    <>
      <ChangesBar />
      <div className="relative w-full h-[calc(100vh-12rem)] overflow-hidden bg-white dark:bg-gray-950">
        <TreeControls />
        {previewTree && (
          <ParentSize>
            {({ width, height }) => <DomainTree data={previewTree} width={width} height={height} />}
          </ParentSize>
        )}
        {showLoader && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-600 dark:text-gray-300">
            <LoadingSpinner size={54} />
            <span className="text-sm font-medium">Loading tree...</span>
          </div>
        )}
      </div>
      <NodeEditDrawer />
    </>
  )
}
