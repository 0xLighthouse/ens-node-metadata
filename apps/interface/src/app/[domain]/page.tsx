'use client'

import { PageInset } from '@/app/components/containers'
import { useAppStore } from '@/stores/app'
import { TreeContainer } from '@/app/components/tree'

export default function Page() {
  const { activeDomain } = useAppStore()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageInset>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{activeDomain?.name || 'Domain Tree'}</h1>
        </div>
      </PageInset>
      <TreeContainer />
    </div>
  )
}
