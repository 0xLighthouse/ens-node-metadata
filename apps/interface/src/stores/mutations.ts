import { create } from 'zustand'
import { setRecords } from '@ensdomains/ensjs/wallet'
import type { WalletClient } from 'viem'
import type { TreeNode } from '@/lib/tree/types'
import { useTreeEditStore, type TreeMutation } from './tree-edits'

const NON_TEXT_RECORD_KEYS = new Set([
  'nodeType',
  'inspectionData',
  'isSuggested',
  'isPendingCreation',
  'isComputed',
  'address',
  'owner',
  'children',
  'id',
  'name',
  'subdomainCount',
  'resolverId',
  'resolverAddress',
  'parentId',
  'ownerEnsName',
  'ownerEnsAvatar',
  'ttl',
  'texts',
])

export interface MutationJob {
  mutationId: string
  ensName: string
  resolverAddress: string
  status: 'pending' | 'signing' | 'submitted' | 'confirmed' | 'error'
  txHash?: `0x${string}`
  error?: string
}

interface MutationsState {
  jobs: MutationJob[]
  status: 'idle' | 'executing' | 'done' | 'error'
  submitMutations: (params: {
    mutationIds: string[]
    findNode: (name: string) => TreeNode | null
    walletClient: WalletClient
  }) => Promise<void>
  reset: () => void
}

export const useMutationsStore = create<MutationsState>((set, get) => ({
  jobs: [],
  status: 'idle',

  submitMutations: async ({ mutationIds, findNode, walletClient }) => {
    const allMutations = useTreeEditStore.getState().pendingMutations
    const selectedMutations: [string, TreeMutation][] = []
    for (const id of mutationIds) {
      const m = allMutations.get(id)
      if (m) selectedMutations.push([id, m])
    }

    if (selectedMutations.length === 0) return

    // Separate creations from edits
    const creations = selectedMutations.filter(([_, m]) => m.createNode)
    const edits = selectedMutations.filter(([_, m]) => !m.createNode)

    // Build initial jobs list
    const jobs: MutationJob[] = []

    // Creations are placeholder — log warning and skip
    for (const [nodeName, creation] of creations) {
      console.warn(
        `[mutations] createSubname not yet implemented — skipping creation for parent "${creation.parentName}"`,
      )
    }

    // Group edits by ensName (setRecords works per-name)
    const editsByName = new Map<
      string,
      { resolverAddress: string; texts: { key: string; value: string }[]; mutationIds: string[] }
    >()

    for (const [ensName, edit] of edits) {
      const node = findNode(ensName)
      const resolverAddress = node?.resolverAddress
      if (!resolverAddress) {
        console.warn(`[mutations] No resolver address found for "${ensName}" — skipping`)
        continue
      }

      // Filter to only text record keys
      const texts: { key: string; value: string }[] = []
      if (edit.changes) {
        for (const [rawKey, value] of Object.entries(edit.changes)) {
          // Strip "texts." prefix — the editor stores extra text records with this prefix
          const key = rawKey.startsWith('texts.') ? rawKey.slice('texts.'.length) : rawKey

          if (NON_TEXT_RECORD_KEYS.has(key)) continue
          if (value === null || value === undefined) continue
          texts.push({ key, value: String(value) })
        }
      }

      if (texts.length === 0) continue

      const existing = editsByName.get(ensName)
      if (existing) {
        existing.texts.push(...texts)
        existing.mutationIds.push(ensName)
      } else {
        editsByName.set(ensName, { resolverAddress, texts, mutationIds: [ensName] })
      }
    }

    // Build jobs from grouped edits
    for (const [ensName, { resolverAddress, mutationIds: mIds }] of editsByName) {
      for (const id of mIds) {
        jobs.push({
          mutationId: id,
          ensName,
          resolverAddress,
          status: 'pending',
        })
      }
    }

    set({ jobs, status: 'executing' })

    const completedMutationIds: string[] = []

    // Submit one setRecords call per ensName
    for (const [ensName, { resolverAddress, texts, mutationIds: mIds }] of editsByName) {
      // Update jobs to signing
      set({
        jobs: get().jobs.map((j) =>
          mIds.includes(j.mutationId) ? { ...j, status: 'signing' as const } : j,
        ),
      })

      try {

        const txHash = await (setRecords as any)(walletClient, {
          name: ensName,
          texts,
          resolverAddress: resolverAddress as `0x${string}`,
        })

        // Update jobs to submitted
        set({
          jobs: get().jobs.map((j) =>
            mIds.includes(j.mutationId)
              ? { ...j, status: 'confirmed' as const, txHash }
              : j,
          ),
        })

        completedMutationIds.push(...mIds)
      } catch (err: any) {
        const errorMessage = err?.message ?? 'Transaction failed'
        set({
          jobs: get().jobs.map((j) =>
            mIds.includes(j.mutationId)
              ? { ...j, status: 'error' as const, error: errorMessage }
              : j,
          ),
          status: 'error',
        })
        console.error(`[mutations] setRecords failed for "${ensName}":`, err)
      }
    }

    // Discard completed mutations from tree-edits store
    const { discardPendingMutation } = useTreeEditStore.getState()
    for (const id of completedMutationIds) {
      discardPendingMutation(id)
    }

    // Also discard creation mutations that were skipped (they were only logged)
    for (const [nodeName] of creations) {
      discardPendingMutation(nodeName)
    }

    // Set final status
    const finalJobs = get().jobs
    const hasErrors = finalJobs.some((j) => j.status === 'error')
    set({ status: hasErrors ? 'error' : 'done' })
  },

  reset: () => set({ jobs: [], status: 'idle' }),
}))
