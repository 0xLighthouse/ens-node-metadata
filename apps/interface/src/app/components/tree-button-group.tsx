'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useUiStore } from '@/stores/ui'
import { useAppStore } from '@/stores/app'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTreeData } from '@/hooks/useTreeData'
import { useRouter, usePathname } from 'next/navigation'
import { Network, Table, Braces } from 'lucide-react'

export const TreeButtonGroup = () => {
  const { routeHistory } = useUiStore()
  const { activeDomain } = useAppStore()
  const { previewTree } = useTreeData()
  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Don't render if on home or select domain page
  if (['/', '/select-name', '/select-domain'].includes(routeHistory.currentPath ?? '')) {
    return null
  }

  const isTreeView = pathname === `/${activeDomain?.name}/tree` || pathname === `/${activeDomain?.name}`
  const isTableView = pathname === `/${activeDomain?.name}/table`

  const handleTreeClick = () => {
    if (activeDomain?.name) {
      router.push(`/${activeDomain.name}/tree`)
    }
  }

  const handleTableClick = () => {
    if (activeDomain?.name) {
      router.push(`/${activeDomain.name}/table`)
    }
  }

  return (
    <>
      <ButtonGroup>
        <Button
          variant={isTreeView ? 'default' : 'outline'}
          size="md"
          onClick={handleTreeClick}
          disabled={!activeDomain?.name}
        >
          <Network className="size-4 mr-2" />
          Tree
        </Button>
        <Button
          variant={isTableView ? 'default' : 'outline'}
          size="md"
          onClick={handleTableClick}
          disabled={!activeDomain?.name}
        >
          <Table className="size-4 mr-2" />
          Table
        </Button>
        <Button variant="outline" size="md" onClick={() => setIsDebugOpen(true)}>
          <Braces className="size-4 mr-2" />
          Debug
        </Button>
      </ButtonGroup>

      <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Debug: Tree Data (with changes)</DialogTitle>
            <DialogDescription>
              Preview tree including all pending mutations and edits
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(previewTree, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
