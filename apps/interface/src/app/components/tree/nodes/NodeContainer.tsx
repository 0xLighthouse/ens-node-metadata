import { memo } from 'react'
import { Position, Handle } from '@xyflow/react'
import { useTreeControlsStore } from '@/stores/tree-controls'

interface NodeContainerProps extends React.PropsWithChildren {
  // Node state
  isSelected?: boolean
  isPendingCreation?: boolean
  hasPendingEdits?: boolean
  isSuggested?: boolean
  isCollapsed?: boolean
  hasChildren?: boolean

  // Accent color for selection/styling
  accentColor?: string

  // Style overrides
  className?: string
  style?: React.CSSProperties
  width?: string | number
  overflow?: 'hidden' | 'visible'
}

const getBackgroundColor = (
  isSuggested?: boolean,
  isPendingCreation?: boolean,
  hasPendingEdits?: boolean,
  accentColor?: string,
) => {
  if (isSuggested) return '#f8fafc'
  if (isPendingCreation) {
    // Use accent color for pending creation if provided
    if (accentColor === '#f59e0b') return '#fffbeb' // Amber
    if (accentColor === '#6366f1') return '#eef2ff' // Indigo
    return '#f0fdf4' // Green default
  }
  if (hasPendingEdits) return '#fff7ed' // Orange
  return 'white'
}

const getBorderStyle = (
  isSuggested?: boolean,
  isPendingCreation?: boolean,
  hasPendingEdits?: boolean,
  accentColor?: string,
) => {
  if (isSuggested) return '2px dashed #cbd5e1'
  if (isPendingCreation) {
    const color = accentColor || '#22c55e'
    return `2px dashed ${color}`
  }
  if (hasPendingEdits) return '2px dashed #fb923c'

  // Default border with accent color
  if (accentColor) {
    // Lighten the accent color for border
    if (accentColor === '#f59e0b') return '1px solid #fde68a'
    if (accentColor === '#6366f1') return '1px solid #c7d2fe'
  }
  return '1px solid #e2e8f0'
}

const getBoxShadow = (
  isSelected?: boolean,
  isPendingCreation?: boolean,
  hasPendingEdits?: boolean,
  accentColor?: string,
) => {
  if (isSelected && accentColor) {
    // Use accent color for selection shadow
    if (accentColor === '#f59e0b') return '0 4px 12px rgba(245, 158, 11, 0.3)'
    if (accentColor === '#6366f1') return '0 4px 12px rgba(99, 102, 241, 0.3)'
  }
  if (isSelected) return '0 4px 12px rgba(0, 0, 0, 0.15)'
  if (isPendingCreation) {
    if (accentColor === '#f59e0b') return '0 4px 12px rgba(245, 158, 11, 0.25)'
    if (accentColor === '#6366f1') return '0 4px 12px rgba(99, 102, 241, 0.25)'
    return '0 4px 12px rgba(34, 197, 94, 0.25)'
  }
  if (hasPendingEdits) return '0 4px 12px rgba(249, 115, 22, 0.25)'

  // Default shadow with subtle accent
  if (accentColor === '#f59e0b') return '0 2px 8px rgba(245, 158, 11, 0.15)'
  if (accentColor === '#6366f1') return '0 2px 8px rgba(99, 102, 241, 0.15)'
  return '0 2px 8px rgba(0, 0, 0, 0.1)'
}

const getRingStyle = (
  isSelected?: boolean,
  isCollapsed?: boolean,
  hasChildren?: boolean,
  hasPendingEdits?: boolean,
  isPendingCreation?: boolean,
  accentColor?: string,
) => {
  if (isSelected) {
    const color = accentColor === '#f59e0b' ? 'ring-amber-500' : accentColor === '#6366f1' ? 'ring-indigo-500' : 'ring-indigo-500'
    return `ring-2 ${color} ring-offset-2`
  }
  if (isCollapsed && hasChildren && !hasPendingEdits && !isPendingCreation) {
    const color = accentColor === '#f59e0b' ? 'ring-amber-200' : accentColor === '#6366f1' ? 'ring-indigo-200' : 'ring-indigo-200'
    return `ring-2 ${color}`
  }
  return ''
}

export const NodeContainer = memo(({
  children,
  isSelected,
  isPendingCreation,
  hasPendingEdits,
  isSuggested,
  isCollapsed,
  hasChildren,
  accentColor,
  className,
  style,
  width = '256px',
  overflow = 'hidden',
}: NodeContainerProps) => {
  const { orientation } = useTreeControlsStore()
  const isVertical = orientation === 'vertical'
  const targetPosition = isVertical ? Position.Top : Position.Left
  const sourcePosition = isVertical ? Position.Bottom : Position.Right

  const baseClasses = `
    relative
    cursor-pointer
    transition-all
    duration-200
    outline-none
    focus:outline-none
    ${getRingStyle(isSelected, isCollapsed, hasChildren, hasPendingEdits, isPendingCreation, accentColor)}
    ${isSuggested ? 'opacity-50' : ''}
    ${className || ''}
  `.trim().replace(/\s+/g, ' ')

  const baseStyle: React.CSSProperties = {
    width,
    backgroundColor: getBackgroundColor(isSuggested, isPendingCreation, hasPendingEdits, accentColor),
    border: getBorderStyle(isSuggested, isPendingCreation, hasPendingEdits, accentColor),
    borderRadius: '12px',
    overflow,
    boxShadow: getBoxShadow(isSelected, isPendingCreation, hasPendingEdits, accentColor),
    ...style,
  }

  return (
    <div className={baseClasses} style={baseStyle}>
      {children}
      <Handle type="target" position={targetPosition} className="pointer-events-none opacity-0" />
      <Handle type="source" position={sourcePosition} className="pointer-events-none opacity-0" />
    </div>
  )
})
