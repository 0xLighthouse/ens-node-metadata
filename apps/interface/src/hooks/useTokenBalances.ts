import { useState, useEffect } from 'react'
import { Address, formatUnits } from 'viem'
import { readClient, context, ERC20WithFaucetABI } from '@/config/web3'
import { useAccount } from './useAccount'

interface TokenConfig {
  address: Address
  symbol: string
  name: string
  decimals: number
}

const TOKEN_CONFIGS: TokenConfig[] = [
  {
    address: context.contracts.USDC.address,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: context.contracts.BoardUnderlyingToken.address,
    symbol: 'Hook',
    name: 'Board Underlying Token',
    decimals: 18,
  },
  {
    address: context.contracts.MockToken.address,
    symbol: 'MOCK',
    name: 'Mock Token',
    decimals: 18,
  },
]

interface TokenWithBalance extends TokenConfig {
  balance: string
  isLoading: boolean
}

export function useTokenBalances() {
  const { address, isConnected } = useAccount()
  const [tokens, setTokens] = useState<TokenWithBalance[]>(() =>
    TOKEN_CONFIGS.map(token => ({
      ...token,
      balance: '0',
      isLoading: true,
    }))
  )

  useEffect(() => {
    if (!address || !isConnected) {
      setTokens(prev => prev.map(token => ({
        ...token,
        balance: '0',
        isLoading: false,
      })))
      return
    }

    const fetchBalances = async () => {
      setTokens(prev => prev.map(token => ({ ...token, isLoading: true })))

      try {
        const balancePromises = TOKEN_CONFIGS.map(async (token) => {
          try {
            const balance = await readClient.readContract({
              address: token.address,
              abi: ERC20WithFaucetABI,
              functionName: 'balanceOf',
              args: [address],
            })

            const formattedBalance = formatUnits(balance, token.decimals)
            return {
              ...token,
              balance: parseFloat(formattedBalance).toFixed(token.decimals === 6 ? 2 : 4),
              isLoading: false,
            }
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error)
            return {
              ...token,
              balance: '0',
              isLoading: false,
            }
          }
        })

        const balances = await Promise.all(balancePromises)
        setTokens(balances)
      } catch (error) {
        console.error('Error fetching token balances:', error)
        setTokens(prev => prev.map(token => ({
          ...token,
          balance: '0',
          isLoading: false,
        })))
      }
    }

    fetchBalances()

    // Refetch every 30 seconds
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [address, isConnected])

  const refetch = async () => {
    if (!address || !isConnected) return

    setTokens(prev => prev.map(token => ({ ...token, isLoading: true })))

    try {
      const balancePromises = TOKEN_CONFIGS.map(async (token) => {
        try {
          const balance = await readClient.readContract({
            address: token.address,
            abi: ERC20WithFaucetABI,
            functionName: 'balanceOf',
            args: [address],
          })

          const formattedBalance = formatUnits(balance, token.decimals)
          return {
            ...token,
            balance: parseFloat(formattedBalance).toFixed(token.decimals === 6 ? 2 : 4),
            isLoading: false,
          }
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error)
          return {
            ...token,
            balance: '0',
            isLoading: false,
          }
        }
      })

      const balances = await Promise.all(balancePromises)
      setTokens(balances)
    } catch (error) {
      console.error('Error fetching token balances:', error)
      setTokens(prev => prev.map(token => ({
        ...token,
        balance: '0',
        isLoading: false,
      })))
    }
  }

  return {
    tokens,
    isLoading: tokens.some(token => token.isLoading),
    refetch,
  }
}