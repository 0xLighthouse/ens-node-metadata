import { createPublicClient, http, erc20Abi, Abi } from 'viem'
import { arbitrumSepolia, hardhat } from 'viem/chains'

import { SignalsABI, IncentivesABI, BondHookABI } from '../../../../packages/abis'

// Default public client for server components or initial loading
// Components should prefer using the context via useWeb3() whenever possible
export const readClient = createPublicClient({
  chain: process.env.NEXT_PUBLIC_SIGNALS_ENV === 'dev' ? hardhat : arbitrumSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
})

export const ERC20WithFaucetABI = [
  ...erc20Abi,
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'faucet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] satisfies Abi

export const SIGNALS_ABI = SignalsABI

export const INDEXER_ENDPOINT = process.env.NEXT_PUBLIC_INDEXER_ENDPOINT!

/**
 * Critical addresses
 */
export const context = {
  network: {
    explorerUri: 'https://sepolia.arbiscan.io',
    arbitrumSepolia: {
      chainId: 421614,
      transport: http(process.env.ARBITRUM_SEPOLIA_RPC_URL!),
    },
  },
  contracts: {
    USDC: {
      abi: ERC20WithFaucetABI,
      address: '0x0eFf88D35f413cD1146269D916fb87A451B03d6D' as `0x${string}`,
      label: 'mUSDC',
    },
    BoardUnderlyingToken: {
      abi: ERC20WithFaucetABI,
      address: '0x4713635357F9d01cBAF4DAc7E93B66D69544DEa8' as `0x${string}`,
      label: 'Hook',
      decimals: 18, // TODO: Should be dynamic
    },
    BondHook: {
      abi: BondHookABI,
      address: '0xA429a75F874B899Ee6b0ea080d7281544506b8c0' as `0x${string}`,
    },
    MockToken: {
      abi: ERC20WithFaucetABI,
      address: '0xd33f07bd0f04c4f47c7f8492886ed52dd2fb81d5' as `0x${string}`,
    },
  },
}
