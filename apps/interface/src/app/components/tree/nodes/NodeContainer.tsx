import { memo } from 'react'
import { Position, Handle } from '@xyflow/react'
import { useTreeControlsStore } from '@/stores/tree-controls'

interface NodeContainerProps extends React.PropsWithChildren {
  className?: string
  style?: React.CSSProperties
}

export const NodeContainer = memo(({ children, className, style }: NodeContainerProps) => {
  const { orientation } = useTreeControlsStore()
  const isVertical = orientation === 'vertical'
  const targetPosition = isVertical ? Position.Top : Position.Left
  const sourcePosition = isVertical ? Position.Bottom : Position.Right

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {children}
      <Handle type="target" position={targetPosition} className="pointer-events-none opacity-0" />
      <Handle type="source" position={sourcePosition} className="pointer-events-none opacity-0" />
    </div>
  )
})
