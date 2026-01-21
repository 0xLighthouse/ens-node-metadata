'use client'

import { usePrivy } from '@privy-io/react-auth'
import Link from 'next/link'

export function Unauthenticated() {
  const { authenticated } = usePrivy()

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 py-16">
      {!authenticated ? (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to Lighthouse</h1>
          <p className="text-muted-foreground text-lg">Please connect your wallet to continue</p>
        </div>
      ) : (
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">ENS org registrar</h1>
            <p className="text-muted-foreground text-lg">
              This interface{' '}
              <Link href="https://ens.org" target="_blank" rel="noopener noreferrer">
                allows you
              </Link>{' '}
              to manage company metadata on ENS
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
