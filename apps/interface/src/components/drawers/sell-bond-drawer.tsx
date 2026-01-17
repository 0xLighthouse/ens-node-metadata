'use client'

import { Tag } from 'lucide-react'
import { toast } from 'sonner'

import { buttonVariants } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { useEffect, useState } from 'react'

import { useAccount } from '@/hooks/useAccount'
import { usePrivy } from '@privy-io/react-auth'
import { useHarborStore } from '@/stores/useHarborStore'
import { useMarketsStore } from '@/stores/useMarketsStore'
import { Bond } from '@harbor/shared'
import { SellBondWizard } from '../containers/sell-bond/wizard'

interface Props {
  harborKey: string
}

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center gap-6 p-8 text-center">
      {/* Copy */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">No compatible bonds found</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          We couldn&apos;t find any positions held that meet the selling criteria for this harbor.
        </p>
      </div>
    </div>
  )
}

export function SellBondDrawer({ harborKey }: Props) {
  const { address } = useAccount()
  const { authenticated, login } = usePrivy()
  const { bonds, isFetching, isInitialized, fetchBonds } = useHarborStore()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const market = useMarketsStore((state) => state.getMarket(harborKey))

  const handleOnOpenChange = (open: boolean) => {
    if (open) {
      if (!authenticated) {
        login()
        return
      }
      if (!address) {
        toast('Please connect a wallet')
        return
      }
      setIsDrawerOpen(true)
      return
    }
    setIsDrawerOpen(false)
  }

  useEffect(() => {
    if (!isInitialized && !isFetching && address && isDrawerOpen) {
      console.log('render() - fetching bonds')
      fetchBonds(harborKey, address as `0x${string}`)
    }
  }, [isInitialized, isFetching, fetchBonds, harborKey, address, isDrawerOpen])

  return (
    <Drawer dismissible={true} open={isDrawerOpen} onOpenChange={handleOnOpenChange}>
      <DrawerTrigger
        className={buttonVariants({
          variant: 'outline',
          size: 'md',
          class: 'flex items-center gap-2',
        })}
      >
        <Tag className="h-4 w-4" />
        <span>Sell</span>
      </DrawerTrigger>
      <DrawerContent className="p-0">
        {!isInitialized && <div>Loading...</div>}
        {isInitialized && bonds.size === 0 && <EmptyState />}
        {isInitialized && bonds.size > 0 && (
          <SellBondWizard
            harborKey={harborKey}
            bonds={Array.from(bonds.values()) as Bond[]}
            onSell={() => setIsDrawerOpen(false)}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
