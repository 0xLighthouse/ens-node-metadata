import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

export const TreeButtonGroup = () => {
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
