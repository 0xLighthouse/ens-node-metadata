'use client'

import { usePrivy } from '@privy-io/react-auth'
import { PageInset } from './components/containers'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user } = usePrivy()
  const router = useRouter()

  // Redirect to the select-domain page if the user is authenticated
  useEffect(() => {
    if (user) {
      router.replace('/select-domain')
    }
  }, [user, router])

  return (
    <PageInset>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back
          {user?.wallet?.address &&
            `, ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`}
        </p>
      </div>
      <p>You are now authenticated and ready to use the platform!</p>
    </PageInset>
  )
}
