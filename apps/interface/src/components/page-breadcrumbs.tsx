'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAppStore } from '@/stores/app'
import { usePathname } from 'next/navigation'
import { SpaceAvatar } from './ui/space-avatar'
import { useEffect, useState } from 'react'

export const PageBreadcrumbs = () => {
  const activeSpace = useAppStore((state) => state.activeSpace)
  const pathname = usePathname()
  const [isHydrated, setIsHydrated] = useState(false)

  const pathSegments = pathname.split('/').filter(Boolean)
  const rawTitle = pathSegments[pathSegments.length - 1] || ''
  const title = rawTitle
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const isAdminRoute = pathSegments[0] === 'admin'

  // Wait for client-side hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Don't render space breadcrumb during SSR or before hydration
  if (!isHydrated) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {activeSpace && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/onboarding/select-space" className="flex items-center gap-2">
                <SpaceAvatar space={activeSpace} size="sm" />
                {activeSpace.title || activeSpace.ens || activeSpace.spaceId}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
