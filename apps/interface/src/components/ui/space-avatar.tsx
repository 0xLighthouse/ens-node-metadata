'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { Space } from '@/stores/domains'

interface Props {
  space: Space
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-15 w-15',
}

const getProjectAvatar = (project: Space) => {
  if (project?.avatar) return project.avatar
  if (project?.ens) return `https://cdn.stamp.fyi/space/${project.ens}`
  return undefined
}

const generateGradient = (seed: string) => {
  // Simple hash function to generate consistent colors from seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 60) % 360

  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 40%))`
}

const getFallbackText = (space: Space): string => {
  if (space.title) return space.title.charAt(0).toUpperCase()
  if (space.ens) return space.ens.charAt(0).toUpperCase()
  if (space.spaceId) return space.spaceId.charAt(0).toUpperCase()
  return '?'
}

const getGradientSeed = (space: Space): string => {
  return space.spaceId || space.ens || space.title || 'default'
}

export function SpaceAvatar({ space, size = 'md', className }: Props) {
  const [hasImageError, setHasImageError] = useState(false)
  const avatarSrc = getProjectAvatar(space)
  const fallbackText = getFallbackText(space)
  const gradientSeed = getGradientSeed(space)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarSrc && !hasImageError && (
        <AvatarImage
          src={avatarSrc}
          alt={space.title || space.ens || space.spaceId}
          onError={() => setHasImageError(true)}
        />
      )}
      <AvatarFallback
        className="text-white font-medium"
        style={{
          background: generateGradient(gradientSeed),
        }}
      >
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}
