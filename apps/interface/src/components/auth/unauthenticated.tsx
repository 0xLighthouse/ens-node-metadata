'use client'

import { APP_NAME, DOCS_NAV_URL } from '@/config/constants'
import { MetricsStats } from '@/components/metrics-stats'
import Link from 'next/link'

export function Unauthenticated() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-4 py-16">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{APP_NAME}</h1>
          <p className="text-muted-foreground text-lg">
            Connect your wallet to manage{' '}
            <Link
              href={DOCS_NAV_URL}
              className="underline italic"
              target="_blank"
              rel="noopener noreferrer"
            >
              structured metadata
            </Link>{' '}
            across your ENS names
          </p>
        </div>
      </div>

      <MetricsStats />
    </div>
  )
}
