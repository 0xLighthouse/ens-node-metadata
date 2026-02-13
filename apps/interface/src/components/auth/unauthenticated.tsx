'use client'

import { APP_NAME } from '@/config/constants'
import Link from 'next/link'

export function Unauthenticated() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 py-16">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Welcome to the {APP_NAME}</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to continue. This interface{' '}
            <Link href="https://ens.org" target="_blank" rel="noopener noreferrer">
              lets you
            </Link>{' '}
            manage company metadata on ENS using ENSIP standards.
          </p>
        </div>
      </div>
    </div>
  )
}
