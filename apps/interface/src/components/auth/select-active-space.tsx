'use client'

import { useAppStore, type Space } from '@/stores/app'
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
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SelectActiveSpaceProps {
  availableSpaces?: Space[]
}

export function SelectActiveSpace({ availableSpaces }: SelectActiveSpaceProps) {
  const {
    availableSpaces: storeSpaces,
    setActiveSpace,
    isAuthenticated,
    token,
    status,
  } = useAppStore()
  const router = useRouter()

  // Use prop or store spaces
  const spaces = availableSpaces || storeSpaces

  // No need for manual fetching - app store handles initialization

  const handleSelectSpace = (space: Space) => {
    setActiveSpace(space)
    // Redirect to dashboard after selection
    router.push('/')
  }

  // Don't render if not authenticated - let AuthGate handle this
  if (!isAuthenticated) {
    return null
  }

  // Show loading while app is initializing or loading spaces
  if (status === 'initializing' || status === 'loading-spaces') {
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
  if (status === 'ready' && spaces.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">No Spaces Available</h1>
          <p className="text-muted-foreground text-lg">You don't have access to any spaces yet.</p>
          <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted rounded">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</p>
            <p>Status: {status}</p>
            <p>Spaces Count: {spaces.length}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Select a Space</h1>
        <p className="text-muted-foreground text-lg">
          Choose a space to continue working with Lighthouse
        </p>
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
            {spaces.map((space) => (
              <TableRow key={space.spaceId}>
                <TableCell className="flex items-center gap-3">
                  <SpaceAvatar space={space} size="sm" />
                  <div>
                    <div className="font-medium">{space.title || space.ens || space.spaceId}</div>
                    <div className="text-sm text-muted-foreground">{space.spaceId}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {space.ens ? (
                    <code className="text-sm bg-muted px-2 py-1 rounded">{space.ens}</code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {space.isFoundingMember && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Founding Member
                      </span>
                    )}
                    {space.indexedAtHeight && (
                      <span className="text-sm text-muted-foreground">
                        Indexed: {space.indexedAtHeight}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleSelectSpace(space)} size="sm">
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
