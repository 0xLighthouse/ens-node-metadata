'use client'

import { useAppStore } from '@/stores/app'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

const SELECT_DOMAIN_PATH = '/select-name'

export function DomainGate({ children }: Props) {
  const { activeDomain, isInitialized, status } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect to space selection if no active space and app is ready
  useEffect(() => {
    if (
      isInitialized &&
      status === 'ready' &&
      !activeDomain &&
      !pathname.includes(SELECT_DOMAIN_PATH)
    ) {
      router.push(SELECT_DOMAIN_PATH)
    }
  }, [isInitialized, status, activeDomain, pathname, router])

  // Allow onboarding pages to bypass space requirement
  if (pathname.includes(SELECT_DOMAIN_PATH)) {
    return <>{children}</>
  }

  if (!activeDomain) {
    // Show loading or return null while redirecting
    return null
  }

  return <>{children}</>
}
