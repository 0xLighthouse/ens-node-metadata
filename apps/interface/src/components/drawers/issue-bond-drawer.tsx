'use client'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useAccount } from '@/hooks/useAccount'
import { useState } from 'react'
import { toast } from 'sonner'
import { TextInput } from '../inputs'
import { usePrivy } from '@privy-io/react-auth'
import { Card } from '@/components/ui/card'
import { isAddress } from 'viem'
import { format } from 'date-fns'
import { NominalValueInput } from '../inputs/nominal-value-input'
import { DateTimePicker } from '../inputs/date-time-picker'
import { context } from '@/config/web3'

const tokens = [
  {
    address: context.contracts.USDC.address,
    symbol: 'mUSDC',
    name: 'Mock USDC',
    decimals: 6,
  },
]

export function IssueBondDrawer({
  isOpen,
  onOpenChange,
  hideTrigger,
}: { isOpen?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean }) {
  const { address, isConnected } = useAccount()
  const { authenticated, login } = usePrivy()
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    referenceId: '1',
    recipient: '',
    nominalValue: '50000',
    duration: '365',
  })

  // Column state
  const [selectedToken, setSelectedToken] = useState<(typeof tokens)[0] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [maturityDate, setMaturityDate] = useState<Date | undefined>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
  )
  const [maturityTime, setMaturityTime] = useState<string>('12:00:00') // Default to noon

  // Calculated values for summary
  const getMaturityDateTime = () => {
    if (!maturityDate) return new Date()

    // Combine date and time
    const [hours, minutes, seconds] = maturityTime.split(':').map(Number)
    const combinedDateTime = new Date(maturityDate)
    combinedDateTime.setHours(hours, minutes, seconds, 0)

    return combinedDateTime
  }

  const calculatedValues = {
    referenceId: parseInt(formData.referenceId) || 0,
    nominalValueEth: parseFloat(formData.nominalValue) || 0,
    nominalValueWei: parseFloat(formData.nominalValue) * 1e18 || 0,
    maturityDateTime: getMaturityDateTime(),
    durationDays: Math.ceil((getMaturityDateTime().getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    durationSeconds: Math.ceil((getMaturityDateTime().getTime() - Date.now()) / 1000),
    maturityDate: maturityDate || new Date(),
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNominalValueChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      nominalValue: value,
    }))
  }

  const handleTokenSelect = (token: (typeof tokens)[0]) => {
    setSelectedToken(token)
    setShowForm(true)
  }

  const handleTriggerDrawer = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault()
    if (!authenticated) {
      login()
      return
    }
    if (!address) {
      toast('Please connect a wallet')
      return
    }
    if (onOpenChange) {
      onOpenChange(true)
    } else {
      setIsDrawerOpen(true)
    }
  }

  const handleOnOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setIsDrawerOpen(open)
    }

    // Reset state when drawer closes
    if (!open) {
      setSelectedToken(null)
      setShowForm(false)
      setMaturityDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))
      setMaturityTime('12:00:00')
      setFormData({
        referenceId: '1',
        recipient: '',
        nominalValue: '50000',
        duration: '365',
      })
    }
  }

  const validateForm = () => {
    const referenceId = parseInt(formData.referenceId)
    const nominalValue = parseFloat(formData.nominalValue)

    if (isNaN(referenceId) || referenceId < 0) {
      toast.error('Reference ID must be a valid positive number')
      return false
    }

    if (!formData.recipient.trim()) {
      toast.error('Recipient address is required')
      return false
    }

    if (!isAddress(formData.recipient)) {
      toast.error('Recipient must be a valid Ethereum address')
      return false
    }

    if (isNaN(nominalValue) || nominalValue <= 0) {
      toast.error('Nominal value must be a positive number')
      return false
    }

    const maturityDateTime = getMaturityDateTime()
    if (!maturityDate || maturityDateTime <= new Date()) {
      toast.error('Maturity date and time must be in the future')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)

      // Call bondIssuer.createBond with the form parameters
      console.log('Creating bond with:', {
        referenceId: calculatedValues.referenceId,
        nominalValue: calculatedValues.nominalValueWei,
        duration: calculatedValues.durationSeconds,
        underlyingToken: selectedToken?.address,
      })

      // TODO: Implement actual contract call here
      // const tokenId = await bondIssuer.createBond(
      //   calculatedValues.referenceId,
      //   calculatedValues.nominalValueWei,
      //   calculatedValues.durationSeconds
      // )

      toast.success('Bond successfully issued!')
      // refetchBalances() // Refresh token balances after successful transaction
      handleOnOpenChange(false)
    } catch (error) {
      console.error('Error issuing bond:', error)
      toast.error('Failed to issue bond. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Drawer open={isOpen ?? isDrawerOpen} onOpenChange={handleOnOpenChange}>
      {!hideTrigger && (
        <DrawerTrigger asChild>
          <Button variant="outline" onClick={handleTriggerDrawer}>
            Issue Bonds
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent className="h-[90vh] max-h-[90vh] overflow-hidden">
        <DrawerHeader>
          <DrawerTitle>Issue New Bond</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 md:p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Token Selection & Balances */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-h3">Select Token</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  // onClick={refetchBalances}
                  // disabled={balancesLoading}
                  className="text-sm"
                >
                  {/* {balancesLoading ? 'Refreshing...' : 'Refresh'} */}
                </Button>
              </div>
              <div className="space-y-3">
                {tokens.map((token) => (
                  <Card
                    key={token.address}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                      selectedToken?.address === token.address
                        ? 'border-blue-500 bg-blue-50 shadow-sm dark:bg-blue-950/20 dark:border-blue-400'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                    }`}
                    onClick={() => handleTokenSelect(token)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{token.symbol}</div>
                        <div className="text-sm text-gray-600">{token.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{token.isLoading ? '...' : token.balance}</div>
                        <div className="text-sm text-gray-600">Balance</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Column 2: Bond Parameters Form */}
            {showForm && (
              <div className="space-y-4">
                <h3 className="text-h3">Bond Parameters</h3>
                <Card className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <TextInput
                      id="referenceId"
                      label="Reference ID"
                      placeholder="1"
                      value={formData.referenceId}
                      onChange={(value) => handleChange('referenceId', value)}
                      description="Unique reference identifier for the bond"
                      required
                    />

                    <TextInput
                      id="recipient"
                      label="Recipient Address"
                      placeholder="0x..."
                      value={formData.recipient}
                      onChange={(value) => handleChange('recipient', value)}
                      description="Ethereum address that will receive the bond"
                      required
                    />

                    <NominalValueInput
                      value={formData.nominalValue}
                      onChange={handleNominalValueChange}
                      selectedToken={selectedToken}
                      required
                    />

                    <DateTimePicker
                      date={maturityDate}
                      time={maturityTime}
                      onDateChange={setMaturityDate}
                      onTimeChange={setMaturityTime}
                    />
                  </form>
                </Card>
              </div>
            )}

            {/* Column 3: Bond Summary */}
            {showForm && (
              <div className="space-y-4">
                <h3 className="text-h3">Bond Summary</h3>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference ID:</span>
                      <span className="font-mono">{calculatedValues.referenceId}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Nominal Value:</span>
                      <span className="font-mono">
                        {calculatedValues.nominalValueEth.toLocaleString()}{' '}
                        {selectedToken?.symbol || 'ETH'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-mono">{calculatedValues.durationDays} days</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-mono text-sm">
                        {format(calculatedValues.maturityDateTime, 'PPP')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Maturity Time:</span>
                      <span className="font-mono text-sm">
                        {format(calculatedValues.maturityDateTime, 'pp')}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 shrink-0">Recipient:</span>
                      <span className="font-mono text-xs text-right break-all ml-2">
                        {formData.recipient
                          ? `${formData.recipient.slice(0, 6)}...${formData.recipient.slice(-4)}`
                          : 'Not set'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Underlying Token:</span>
                      <span className="font-mono">{selectedToken?.symbol}</span>
                    </div>

                    <hr className="border-gray-200" />

                    <div className="flex justify-between font-semibold">
                      <span>Wei Value:</span>
                      <span className="font-mono text-xs">
                        {calculatedValues.nominalValueWei.toExponential(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border">
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={!isConnected || isLoading || !selectedToken}
                      className="w-full"
                    >
                      {isLoading ? 'Issuing...' : 'Issue Bond'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
