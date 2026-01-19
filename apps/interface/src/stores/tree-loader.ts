import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DomainTreeNode } from '@/lib/tree/types'

interface TreeLoaderState {
  /**
   * The canonical raw tree data (domain and subnames) as expressed on-chain.
   */
  sourceTree: DomainTreeNode | null
  treeRootName: string | null
  lastFetchedAt: number | null
  isLoading: boolean
  isRefreshing: boolean
  hasHydrated: boolean

  setHasHydrated: () => void
  loadTree: (rootName: string) => Promise<void>
  refreshTree: (rootName: string) => Promise<void>
  setTree: (tree: DomainTreeNode | null) => void
}

// Hardcoded sample tree for testing d3 rendering
const sampleTree: DomainTreeNode = {
  name: 'ens.eth',
  address: '0x0eb5...7576',
  children: [
    {
      name: 'app.ens.eth',
      address: '0x83e3...c360',
      children: [
        {
          name: 'beta.app.ens.eth',
          address: '0xbc1e...62f9',
        },
        {
          name: 'staging.app.ens.eth',
          address: '0xde4f...82a1',
        },
      ],
    },
    {
      name: 'docs.ens.eth',
      address: '0x94a2...1b3c',
      children: [
        {
          name: 'api.docs.ens.eth',
          address: '0x7c8d...4e5f',
        },
        {
          name: 'guides.docs.ens.eth',
          address: '0x2f1a...9d8c',
        },
      ],
    },
    {
      name: 'wallet.ens.eth',
      address: '0x5e9c...3a7b',
      children: [
        {
          name: 'mobile.wallet.ens.eth',
          address: '0xa1b2...c4d5',
        },
        {
          name: 'web.wallet.ens.eth',
          address: '0x6d7e...8f9a',
        },
      ],
    },
    {
      name: 'dao.ens.eth',
      address: '0x3c4d...5e6f',
    },
  ],
}

const sampleRootName = sampleTree.name

const applyRootName = (node: DomainTreeNode, rootName: string): DomainTreeNode => {
  const rootSuffix = `.${sampleRootName}`
  const nextName =
    node.name === sampleRootName
      ? rootName
      : node.name.endsWith(rootSuffix)
      ? `${node.name.slice(0, -rootSuffix.length)}.${rootName}`
      : node.name

  return {
    ...node,
    name: nextName,
    children: node.children?.map((child) => applyRootName(child, rootName)),
  }
}

const buildTree = async (rootName: string): Promise<DomainTreeNode> => {
  // TODO: replace with the client-side tree generation process.

  // Wait for 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 5000))

  return applyRootName(sampleTree, rootName)
}

export const useTreeLoaderStore = create<TreeLoaderState>()(
  persist(
    (set, get) => ({
      sourceTree: null,
      treeRootName: null,
      lastFetchedAt: null,
      isLoading: true,
      isRefreshing: false,
      hasHydrated: false,

      setHasHydrated: () => {
        const { sourceTree } = get()
        set({ hasHydrated: true, isLoading: !sourceTree })
      },

      loadTree: async (rootName) => {
        if (!rootName) {
          set({ isLoading: false })
          return
        }

        const { sourceTree, treeRootName } = get()
        if (sourceTree && treeRootName === rootName) {
          set({ isLoading: false })
          return
        }

        if (treeRootName !== rootName) {
          set({ sourceTree: null, treeRootName: rootName })
        }

        set({ isLoading: true })
        try {
          const tree = await buildTree(rootName)
          set({ sourceTree: tree, treeRootName: rootName, lastFetchedAt: Date.now() })
        } finally {
          set({ isLoading: false })
        }
      },

      refreshTree: async (rootName) => {
        if (!rootName) {
          set({ isRefreshing: false, isLoading: false })
          return
        }

        const { sourceTree, treeRootName } = get()
        const shouldReset = treeRootName !== rootName

        if (shouldReset) {
          set({ sourceTree: null, treeRootName: rootName, isLoading: true })
        }

        set({ isRefreshing: true, isLoading: shouldReset || !sourceTree })
        try {
          const tree = await buildTree(rootName)
          set({ sourceTree: tree, treeRootName: rootName, lastFetchedAt: Date.now() })
        } finally {
          set({ isRefreshing: false, isLoading: false })
        }
      },

      setTree: (tree) => {
        set({ sourceTree: tree })
      },
    }),
    {
      name: 'tree-loader-store',
      partialize: (state) => ({
        sourceTree: state.sourceTree,
        treeRootName: state.treeRootName,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    },
  ),
)
