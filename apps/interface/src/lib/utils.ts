import { type ClassValue, clsx } from 'clsx'
import { formatDistanceToNow, fromUnixTime } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgoWords(timestamp: number | string) {
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds)) return ''
  return formatDistanceToNow(fromUnixTime(seconds), { addSuffix: true })
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.flat()
}

export const resolveAvatar = (address?: string, size?: string | number) => {
  if (!address) return
  return `https://cdn.stamp.fyi/avatar/${address}${size ? `?s=${size}` : ''}`
}
