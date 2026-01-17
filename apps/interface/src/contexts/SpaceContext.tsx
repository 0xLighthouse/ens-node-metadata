'use client'

import { createContext, useContext } from 'react'
import { useSpacesStore, type Space } from '@/stores/spaces'

interface ISpaceContext {
  activeSpace: Space | null
  availableSpaces: Space[]
  isLoading: boolean
  error: string | null
  setActiveSpace: (space: Space | null) => void
  clearActiveSpace: () => void
  fetchSpaces: () => Promise<void>
}

const SpaceContext = createContext<ISpaceContext>({
  activeSpace: null,
  availableSpaces: [],
  isLoading: false,
  error: null,
  setActiveSpace: () => {},
  clearActiveSpace: () => {},
  fetchSpaces: async () => {},
})

export const useSpace = () => useContext(SpaceContext)

const SpaceContextProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    activeSpace,
    availableSpaces,
    isLoading,
    error,
    setActiveSpace,
    clearActiveSpace,
    fetchSpaces
  } = useSpacesStore()

  return (
    <SpaceContext.Provider
      value={{
        activeSpace,
        availableSpaces,
        isLoading,
        error,
        setActiveSpace,
        clearActiveSpace,
        fetchSpaces
      }}
    >
      {children}
    </SpaceContext.Provider>
  )
}

export const SpaceProvider = ({ children }: { children: React.ReactNode }) => {
  return <SpaceContextProvider>{children}</SpaceContextProvider>
}
