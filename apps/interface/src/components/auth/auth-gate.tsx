import { cookies } from 'next/headers'
import { AUTH_TOKEN_COOKIE } from '@/config/constants'
import { Unauthenticated } from './unauthenticated'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  // Server-side authentication check
  const cookieStore = cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)
  const isAuthenticated = !!token?.value

  if (!isAuthenticated) {
    return <Unauthenticated />
  }

  return <>{children}</>
}
