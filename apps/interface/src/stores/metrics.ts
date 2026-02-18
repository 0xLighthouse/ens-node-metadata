import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MetricRow {
  class: string
  counts: number
}

interface MetricsState {
  metrics: MetricRow[]
  lastFetchedAt: number | null
  isLoading: boolean
  error: string | null

  fetchMetrics: () => Promise<void>
  refresh: () => Promise<void>
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set, get) => ({
      metrics: [],
      lastFetchedAt: null,
      isLoading: false,
      error: null,

      fetchMetrics: async () => {
        const { lastFetchedAt } = get()
        if (lastFetchedAt !== null && Date.now() - lastFetchedAt < ONE_DAY_MS) {
          return
        }

        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/metrics')
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`)
          }
          const metrics: MetricRow[] = await response.json()
          set({ metrics, lastFetchedAt: Date.now() })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch metrics' })
        } finally {
          set({ isLoading: false })
        }
      },

      refresh: async () => {
        set({ lastFetchedAt: null })
        await get().fetchMetrics()
      },
    }),
    {
      name: 'metrics-store',
      partialize: (state) => ({
        metrics: state.metrics,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
)
