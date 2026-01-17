import { Address } from 'viem'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useIsClient } from './useIsClient'

interface AccountData {
  address: Address | undefined
  isConnected: boolean
  isConnecting: boolean
  status: 'connecting' | 'connected' | 'disconnected'
  networkName?: string
  isWrongNetwork?: boolean
}

// Expected network for the app
const EXPECTED_CHAIN_ID = 'eip155:84532' // Base Sepolia

// Network mapping for common chains
const networkNames: Record<string, string> = {
  'eip155:1': 'Ethereum',
  'eip155:84532': 'Base Sepolia',
  'eip155:8453': 'Base',
  'eip155:42161': 'Arbitrum',
  'eip155:421614': 'Arbitrum Sepolia',
  'eip155:137': 'Polygon',
  'eip155:31337': 'Hardhat',
}

export const useAccount = (): AccountData => {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const isClient = useIsClient()

  if (!isClient) {
    return {
      address: undefined,
      isConnected: false,
      isConnecting: false,
      status: 'disconnected',
    }
  }

  // If Privy has a wallet address
  if (authenticated && user?.wallet?.address) {
    // Get network info from the first connected wallet
    const wallet = wallets[0]
    const chainId = wallet?.chainId
    const isWrongNetwork = chainId ? chainId !== EXPECTED_CHAIN_ID : false
    const networkName = chainId ? networkNames[chainId] || 'Unknown Network' : undefined

    return {
      address: user.wallet.address as Address,
      isConnected: true,
      isConnecting: false,
      status: 'connected',
      networkName,
      isWrongNetwork,
    }
  }

  return {
    address: undefined,
    isConnected: false,
    isConnecting: false,
    status: 'disconnected',
  }
}
