'use client'

import { PageInset } from '@/app/components/containers'
import { useAppStore } from '@/stores/app'
import { TreeDataProvider } from '@/contexts/TreeDataContext'
import { TreeContainer } from '@/app/components/tree'

function PageContent() {
  const { activeDomain } = useAppStore()

  return (
    <>
      <PageInset>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{activeDomain?.name || 'Domain Tree'}</h1>
        </div>
      </PageInset>
      <TreeContainer />
    </>
  )
}

export default function Page() {
  return (
    <TreeDataProvider>
      <PageContent />
    </TreeDataProvider>
  )
}
