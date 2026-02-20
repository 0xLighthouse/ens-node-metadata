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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/stores/app'
import type { ENSRootDomain } from '@/types'
import { format, fromUnixTime } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

  console.log('----- SELECT ACTIVE DOMAIN -----')
  console.log('domains', domains)
  console.log('status', status)
  console.log('isInitialized', isInitialized)

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ENS Record</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                No names found.
                </TableCell>
              </TableRow>
            ) : (
              domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{domain.name}</div>
                      <div className="text-sm text-muted-foreground">{domain.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {domain.expiryDate ? (
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {format(fromUnixTime(Number(domain.expiryDate)), 'PP p')}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleSelectDomain(domain)} size="sm">
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
