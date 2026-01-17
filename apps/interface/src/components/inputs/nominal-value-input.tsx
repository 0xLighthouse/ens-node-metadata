'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextInput } from '../inputs'

interface Token {
  address: string
  symbol: string
  name: string
  balance: string
  decimals: number
}

interface NominalValueInputProps {
  value: string
  onChange: (value: string) => void
  selectedToken: Token | null
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
}

export function NominalValueInput({
  value,
  onChange,
  selectedToken,
  label,
  placeholder = "50000",
  description,
  required = false
}: NominalValueInputProps) {
  const [selectedPercentage, setSelectedPercentage] = useState<string>('Custom')

  const handlePercentageSelect = (percentage: string) => {
    setSelectedPercentage(percentage)
    
    if (selectedToken && percentage !== 'Custom') {
      const tokenBalance = parseFloat(selectedToken.balance)
      const percentValue = parseFloat(percentage.replace('%', '')) / 100
      const calculatedAmount = (tokenBalance * percentValue).toString()
      
      onChange(calculatedAmount)
    }
  }

  const handleValueChange = (newValue: string) => {
    onChange(newValue)
    setSelectedPercentage('Custom')
  }

  const displayLabel = label || `Nominal Value (${selectedToken?.symbol || 'ETH'})`
  const displayDescription = description || 
    `The face value of the bond in ${selectedToken?.symbol || 'ETH'} ${
      selectedToken ? `(Balance: ${selectedToken.balance} ${selectedToken.symbol})` : ''
    }`

  return (
    <div className="space-y-3">
      <TextInput
        id="nominalValue"
        label={displayLabel}
        placeholder={placeholder}
        value={value}
        onChange={handleValueChange}
        description={displayDescription}
        required={required}
      />
      
      {selectedToken && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Select amount from balance</p>
          <div className="grid grid-cols-4 gap-2">
            {['100%', '50%', '25%', 'Custom'].map((percentage) => (
              <Button
                key={percentage}
                type="button"
                variant={selectedPercentage === percentage ? 'default' : 'outline'}
                size="sm"
                className={`text-sm transition-colors ${
                  selectedPercentage === percentage 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-white text-black hover:bg-gray-50 border-gray-300'
                }`}
                onClick={() => handlePercentageSelect(percentage)}
              >
                {percentage}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}