'use client'

import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth'
import { mainnet } from 'viem/chains'
import { addEnsContracts } from '@ensdomains/ensjs'
import { createContext, useContext, useEffect, useState } from 'react'
import { createPublicClient, http, WalletClient, createWalletClient, custom } from 'viem'
import { useAppStore } from '@/stores/app'

const chain = addEnsContracts(mainnet)

// Create shared public client instance
const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
})

const Web3Context = createContext<IWeb3Context>({
  publicClient,
  walletClient: null,
  isInitialized: false,
})

export const useWeb3 = () => useContext(Web3Context)

interface IWeb3Context {
  isInitialized: boolean
  publicClient: any
  walletClient: WalletClient | null
}

// Separate internal component that uses Privy hooks
const Web3ContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const { ready: privyReady, user } = usePrivy()
  const { ready: walletReady, wallets } = useWallets()
  const { isInitialized, status } = useAppStore()

  useEffect(() => {
    // Initialize the app store only once
    if (privyReady && walletReady && user && !isInitialized && status === 'idle') {
      useAppStore.getState().initialize(user)
    }
  }, [privyReady, walletReady, user, isInitialized, status])

  // Make a viem signer available once the app has initialized
  useEffect(() => {
    const makeWalletClient = async () => {
      await wallets[0].switchChain(chain.id)
      const provider = await wallets[0].getEthereumProvider()
      if (provider) {
        const walletClient = createWalletClient({
          account: wallets[0].address as `0x${string}`,
          chain,
          transport: custom(provider),
        })
        setWalletClient(walletClient)
      }
    }

    if (isInitialized) {
      makeWalletClient()
    }
  }, [isInitialized, wallets])

  return (
    <Web3Context.Provider value={{ publicClient, walletClient, isInitialized }}>
      {children}
    </Web3Context.Provider>
  )
}

// Main provider that sets up Privy
export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        appearance: {
          theme: 'dark',
        },
        supportedChains: [chain],
        defaultChain: chain,
      }}
    >
      <Web3ContextProvider>{children}</Web3ContextProvider>
    </PrivyProvider>
  )
}
