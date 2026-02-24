'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Fragment } from 'react'
import { usePathname } from 'next/navigation'
import { FolderUp } from 'lucide-react'
import Link from 'next/link'

export const PageBreadcrumbs = () => {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  const formatSegment = (segment: string) => {
    const decoded = decodeURIComponent(segment)
    if (decoded.includes('.')) return decoded
    return decoded
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const breadcrumbs = pathSegments.length
    ? pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/')
        return {
          href,
          label: formatSegment(segment),
          isRoot: index === 0,
          isLast: index === pathSegments.length - 1,
        }
      })
    : [
        {
          href: '/',
          label: 'Home',
          isRoot: true,
          isLast: true,
        },
      ]

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-base text-neutral-600 leading-none">
        <BreadcrumbItem>
          <Link
            href="/select-name"
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Back to domain selection"
          >
            <FolderUp className="size-4" />
          </Link>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="text-neutral-400" />
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem className="gap-2">
              {crumb.isRoot && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-ens-gradient-start), var(--color-ens-gradient-end))',
                  }}
                >
                  <img src="/images/ens-icon.svg" alt="ENS" className="h-3.5 w-3.5" />
                </span>
              )}
              {crumb.isLast ? (
                <BreadcrumbPage className="text-neutral-700">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={crumb.href}
                  className={
                    crumb.isRoot
                      ? 'font-medium text-neutral-800 underline decoration-2 underline-offset-4'
                      : 'font-medium text-neutral-600 hover:text-neutral-800'
                  }
                >
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator className="text-neutral-400" />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
