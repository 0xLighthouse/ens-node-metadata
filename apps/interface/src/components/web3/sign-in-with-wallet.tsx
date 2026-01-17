'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@nextui-org/spinner'
import { createWalletClient, custom } from 'viem'

import { QUERY_NONCE } from '@/graphql/query.nonce'
import { QUERY_SIGN_IN_MESSAGE } from '@/graphql/query.sign-in-message'
import { MUTATION_CONNECT } from '@/graphql/mutation.connect'
import { api } from '@/lib/api-client'
import { useAccount } from '@/hooks/useAccount'
import { baseSepolia, mainnet } from 'viem/chains'

interface SignInMessageData {
  domain: string
  types: string
  value: string
}

interface State {
  isSigningIn: boolean
  signInData: { signInMessage: SignInMessageData; nonce: string } | null
}

interface AuthStore {
  setBearerToken: (token: string) => void
}

interface SignInWithWalletProps {
  onSuccess?: (token: string) => void
  authStore?: AuthStore
}

// Remove hardcoded typedData - we'll use the server-provided data instead

export const SignInWithWallet: React.FC<SignInWithWalletProps> = ({ onSuccess, authStore }) => {
  const { user, logout, connectWallet } = usePrivy()
  const { wallets } = useWallets()
  const { address } = useAccount()

  const [state, setState] = useState<State>({
    isSigningIn: false,
    signInData: null,
  })

  const fetchSignInMessageWithNonce = async (_address: string, _chainId: number) => {
    const { nonce } = await api.request<{ nonce: string }>(QUERY_NONCE)

    console.info('nonce', nonce)

    const input = {
      address: _address.toLowerCase(),
      chainId: _chainId,
      nonce,
    }

    const { signInMessage } = await api.request<{
      signInMessage: SignInMessageData
    }>(QUERY_SIGN_IN_MESSAGE, { input })

    return { signInMessage, nonce }
  }

  // Clear sign-in data when address or chain changes
  useEffect(() => {
    setState((prev) => ({ ...prev, signInData: null }))
  }, [address, wallets])


  const handleSignIn = async () => {
    if (!address || !wallets[0]) return

    try {
      setState((prev) => ({ ...prev, isSigningIn: true }))

      const chainId = wallets[0]?.chainId
        ? Number.parseInt(wallets[0].chainId.split(':')[1])
        : 84532

      // Generate sign-in data only if we don't have it, or if address/chain changed
      let signInData = state.signInData
      if (!signInData) {
        signInData = await fetchSignInMessageWithNonce(address, chainId)
        setState((prev) => ({ ...prev, signInData }))
      }

      // privyClient.getEthereumProvider() gives you an EIP-1193 provider
      const provider = await wallets[0].getEthereumProvider()

      // Create a viem wallet client from it
      const walletClient = createWalletClient({
        chain: baseSepolia,
        transport: custom(provider),
      })

      if (!provider) {
        throw new Error('No Ethereum provider available')
      }

      // Prepare typed data for signing using the server-provided data
      const typedData = {
        domain: JSON.parse(signInData.signInMessage.domain),
        types: JSON.parse(signInData.signInMessage.types),
        primaryType: 'SignIn', // Required for RPC call, based on server's getSignInMessage types
        message: JSON.parse(signInData.signInMessage.value),
      }

      console.log('=== SIGNING TYPED DATA ===')
      console.log('Address:', address)
      console.log('Chain ID:', chainId)
      console.log('Typed Data:', JSON.stringify(typedData, null, 2))

      const signature = await walletClient.signTypedData({
        account: address,
        ...typedData,
      })

      // // Sign with eth_signTypedData_v4 using the encoded data
      // const signature = await provider.request({
      //   method: 'eth_signTypedData_v4',
      //   params: [address, JSON.stringify(typedData)],
      // })

      console.log('=== SIGNATURE ===')
      console.log('Signature:', signature)

      const input = {
        signature,
        address,
        chainId,
        payload: JSON.stringify({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
        isTypedData: true,
        source: 'privy',
        nonce: signInData.nonce, // Use the same nonce that was used to generate the sign-in message
      }

      console.log('=== DATA SENT TO SERVER ===')
      console.log('Connect input:', JSON.stringify(input, null, 2))
      console.log('Signature:', signature)
      console.log('Nonce:', signInData.nonce)

      const { connect } = await api.request<{
        connect: { token?: string }
      }>(MUTATION_CONNECT, { input })

      if (connect?.token) {
        authStore?.setBearerToken(connect.token)
        onSuccess?.(connect.token)
        // Clear the sign-in data after successful authentication
        setState((prev) => ({ ...prev, signInData: null }))
      }

      setState((prev) => ({ ...prev, isSigningIn: false }))
    } catch (error) {
      console.error('Error signing in:', error)
      setState((prev) => ({ ...prev, isSigningIn: false }))
    }
  }

  // Show different UI based on connection state
  if (!address || !wallets[0]) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Connect wallet</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to get started with Lighthouse.
            </p>
          </div>

          <Button onClick={connectWallet} className="w-full">
            Connect Wallet
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sign in with wallet</h3>
          <p className="text-sm text-muted-foreground">
            Verify your identity by signing a message using your wallet.
          </p>
        </div>

        <Button onClick={handleSignIn} disabled={state.isSigningIn} className="w-full">
          {state.isSigningIn ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Signing message...
            </>
          ) : (
            'Sign message'
          )}
        </Button>
      </div>
    </Card>
  )
}
