'use client'

import { PageInset } from '@/app/components/containers'
import { useAppStore } from '@/stores/app'

export default function DomainPage() {
  const { activeDomain } = useAppStore()

  console.log('----- DOMAIN PAGE -----')
  console.log('activeDomain', activeDomain)

  return (
    <PageInset>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{activeDomain?.name}</h1>
      </div>
    </PageInset>
  )
}
