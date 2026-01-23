'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useUiStore } from '@/stores/ui'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTreeData } from '@/hooks/useTreeData'

export const TreeButtonGroup = () => {
  const { routeHistory } = useUiStore()
  const { previewTree } = useTreeData()
  const [isDebugOpen, setIsDebugOpen] = useState(false)

  // Don't render if on home or select domain page
  if (['/', '/select-domain'].includes(routeHistory.currentPath ?? '')) {
    return null
  }

  return (
    <>
      <ButtonGroup>
        <Button variant="outline" size="md">
          Large
        </Button>
        <Button variant="outline" size="md">
          Button
        </Button>
        <Button variant="outline" size="md" onClick={() => setIsDebugOpen(true)}>
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
