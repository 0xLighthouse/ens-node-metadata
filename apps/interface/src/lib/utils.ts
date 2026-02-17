import { clsx, type ClassValue } from 'clsx'
import { DateTime } from 'luxon'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgoWords(timestamp: number | string) {
  return DateTime.fromSeconds(Number(timestamp)).toRelative()
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.flat()
}

export const resolveAvatar = (address?: string, size?: string | number) => {
  if (!address) return
  return `https://cdn.stamp.fyi/avatar/${address}${size ? `?s=${size}` : ''}`
}
