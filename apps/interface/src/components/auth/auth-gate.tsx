'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Unauthenticated } from './unauthenticated'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { ready, authenticated } = usePrivy()

  // Avoid hydration jank while Privy bootstraps client-side auth state
  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
      </div>
    )
  }

  if (!authenticated) {
    return <Unauthenticated />
  }

  return <>{children}</>
}
