'use client'

import { useAppStore, type ENSRootDomain } from '@/stores/app'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SpaceAvatar } from '@/components/ui/space-avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function SelectDomain() {
  const { registeredDomains: domains, setActiveDomain, status, isInitialized } = useAppStore()
  const router = useRouter()

  console.log('----- SELECT ACTIVE DOMAIN -----')
  console.log('domains', domains)
  console.log('status', status)
  console.log('isInitialized', isInitialized)

  const handleSelectDomain = (domain) => {
    setActiveDomain(domain)
    // Redirect to dashboard after selection
    router.push(`/${domain.name}`)
  }

  // Don't render if not initialized - let Web3Provider handle this
  if (!isInitialized) {
    return null
  }

  // Show loading while app is initializing or loading spaces
  if (status === 'initializing' || status === 'loading-domains') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Loading Spaces</h1>
          <p className="text-muted-foreground text-lg">
            {status === 'initializing'
              ? 'Initializing app...'
              : 'Fetching your available spaces...'}
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Error Loading Spaces</h1>
          <p className="text-muted-foreground text-lg">
            Something went wrong while loading your spaces.
          </p>
        </div>
      </div>
    )
  }

  // Only show "No Spaces Available" when app is ready and truly no spaces
  if (status === 'ready' && domains.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">No Spaces Available</h1>
          <p className="text-muted-foreground text-lg">You don't have access to any spaces yet.</p>
          <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted rounded">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
            <p>Status: {status}</p>
            <p>Domains Count: {domains.length}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Select a Domain</h1>
        <p className="text-muted-foreground text-lg">Choose a domain to load</p>
      </div>

      <div className="w-full max-w-4xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead>ENS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell className="flex items-center gap-3">
                  <SpaceAvatar space={domain} size="sm" />
                  <div>
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-sm text-muted-foreground">{domain.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {domain.namehash ? (
                    <code className="text-sm bg-muted px-2 py-1 rounded">{domain.namehash}</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    asas
                    {/* {domain.isFoundingMember && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Founding Member
                      </span>
                    )}
                    {space.indexedAtHeight && (
                      <span className="text-sm text-muted-foreground">
                        Indexed: {space.indexedAtHeight}
                      </span>
                    )} */}
                  </div>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleSelectDomain(domain)} size="sm">
                    Select
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
