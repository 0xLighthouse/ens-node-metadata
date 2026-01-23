'use client'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { useUiStore } from '@/stores/ui'

export const TreeButtonGroup = () => {
  const { routeHistory } = useUiStore()

  // Don't render if on home or select domain page
  if (['/', '/select-domain'].includes(routeHistory.currentPath ?? '')) {
    return null
  }

  return (
    <ButtonGroup>
      <Button variant="outline" size="md">
        Large
      </Button>
      <Button variant="outline" size="md">
        Button
      </Button>
      <Button variant="outline" size="md">
        Group
      </Button>
    </ButtonGroup>
  )
}
