import { useEffect } from 'react'
import { useUiStore } from '@/stores/useUiStore'

export const useIsMobile = () => {
  const { isMobile, hydrate } = useUiStore()

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768 // Tailwind's md breakpoint
      hydrate({ ui: { isMobile: mobile } })
    }

    // Check on mount
    checkIsMobile()

    // Listen for resize
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [hydrate])

  return isMobile
}