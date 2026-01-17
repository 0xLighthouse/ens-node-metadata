'use client'

import { useAppStore } from '@/stores/app'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SpaceGateProps {
  children: React.ReactNode
}

export function SpaceGate({ children }: SpaceGateProps) {
  const { activeSpace, isAuthenticated, status } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect to space selection if no active space and app is ready
  useEffect(() => {
    if (
      isAuthenticated &&
      status === 'ready' &&
      !activeSpace &&
      !pathname.startsWith('/onboarding')
    ) {
      router.push('/onboarding/select-space')
    }
  }, [isAuthenticated, status, activeSpace, pathname, router])

  // Allow onboarding pages to bypass space requirement
  if (pathname.startsWith('/onboarding')) {
    return <>{children}</>
  }

  if (!activeSpace) {
    // Show loading or return null while redirecting
    return null
  }

  return <>{children}</>
}
