'use client'

import { SignInWithWallet } from '@/components/web3/sign-in-with-wallet'
import { useSessionStore } from '@/stores/session'
import { usePrivy } from '@privy-io/react-auth'

export function Unauthenticated() {
  const { authenticated } = usePrivy()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
      {!authenticated ? (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to Lighthouse</h1>
          <p className="text-muted-foreground text-lg">Please connect your wallet to continue</p>
        </div>
      ) : (
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Welcome to Lighthouse</h1>
            <p className="text-muted-foreground text-lg">Please sign in to continue</p>
          </div>
          <SignInWithWallet
            authStore={useSessionStore.getState()}
            onSuccess={() => {
              // Refresh the page to trigger server-side re-render
              window.location.reload()
            }}
          />
        </div>
      )}
    </div>
  )
}
