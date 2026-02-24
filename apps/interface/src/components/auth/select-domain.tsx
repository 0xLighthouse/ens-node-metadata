'use client'

import { APP_NAME } from '@/config/constants'
import { MetricsStats } from '@/components/metrics-stats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/stores/app'
import type { ENSRootDomain } from '@/types'
import { fromUnixTime } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const isExpired = (domain: ENSRootDomain): boolean => {
  if (!domain.expiryDate) return false
  return fromUnixTime(Number(domain.expiryDate)) < new Date()
}

export function SelectDomain() {
  const {
    registeredDomains: domains,
    setActiveDomain,
    status,
    isInitialized,
    loadDomain,
  } = useAppStore()
  const router = useRouter()
  const [customDomain, setCustomDomain] = useState('')
  const [customDomainError, setCustomDomainError] = useState<string | null>(null)
  const [isCustomDomainLoading, setIsCustomDomainLoading] = useState(false)

  const handleSelectDomain = (domain: ENSRootDomain) => {
    setActiveDomain(domain)
    // Redirect to view [domain] page
    router.push(`/${domain.name}`)
  }

  const handleCustomDomainSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedDomain = customDomain.trim()
    if (!trimmedDomain) {
      setCustomDomainError('Enter an ENS name to continue.')
      return
    }

    setCustomDomainError(null)
    setIsCustomDomainLoading(true)
    try {
      const domain = await loadDomain(trimmedDomain)
      handleSelectDomain(domain)
    } catch (error) {
      setCustomDomainError(error instanceof Error ? error.message : 'Unable to load that domain.')
    } finally {
      setIsCustomDomainLoading(false)
    }
  }

  // Don't render if not initialized - let Web3Provider handle this
  if (!isInitialized) {
    return null
  }

  // Show loading while app is initializing or loading spaces
  if (status === 'initializing' || status === 'loading-domains') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Loading Names</h1>
          <p className="text-muted-foreground text-lg">
            {status === 'initializing'
              ? 'Initializing...'
              : 'Fetching your domains...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Error Loading Names</h1>
          <p className="text-muted-foreground text-lg">
            Something went wrong while loading your names.
          </p>
        </div>
      </div>
    )
  }

  const activeDomains = domains.filter((d) => !isExpired(d))

  return (
    <div className="flex flex-col items-center space-y-8 p-4 py-16">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground text-lg">
          Enter an ENS name to view, or select from one of your owned names below to edit.
        </p>
      </div>

      <MetricsStats />

      <div className="w-full max-w-4xl space-y-6">
        <form
          className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--line))] bg-background p-4 sm:flex-row sm:items-end"
          onSubmit={handleCustomDomainSubmit}
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="custom-ens">ENS name</Label>
            <Input
              id="custom-ens"
              placeholder="vitalik.eth"
              value={customDomain}
              onChange={(event) => {
                setCustomDomain(event.target.value)
                setCustomDomainError(null)
              }}
              aria-invalid={!!customDomainError}
            />
            {customDomainError && <div className="text-sm text-red-500">{customDomainError}</div>}
          </div>
          <Button type="submit" disabled={isCustomDomainLoading || !customDomain.trim()}>
            {isCustomDomainLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Open'
            )}
          </Button>
        </form>

        {activeDomains.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Your ENS names</h2>
            <Table>
              <TableBody>
                {activeDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <span className="text-lg font-semibold">{domain.name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleSelectDomain(domain)} size="sm">
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeDomains.length === 0 && domains.length === 0 && (
          <p className="text-center text-muted-foreground">No names found.</p>
        )}

        {activeDomains.length === 0 && domains.length > 0 && (
          <p className="text-center text-muted-foreground">All your names have expired.</p>
        )}
      </div>
    </div>
  )
}
