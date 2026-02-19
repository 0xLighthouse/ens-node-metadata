'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMetricsStore } from '@/stores/metrics'
import { getNodeConfig } from '@/config/nodes'

export function MetricsStats() {
  const { metrics, isLoading, refresh, fetchMetrics } = useMetricsStore()

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Nodes using ENSIP-XX updated daily from Dune
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-28 rounded-lg border border-[hsl(var(--line))] bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (metrics.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Ecosystem Usage</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {metrics.map((row) => {
          const config = getNodeConfig(row.class)
          const Icon = config.icon
          return (
            <div
              key={row.class}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-[hsl(var(--line))] bg-background px-4 py-3 min-w-24"
            >
              <Icon className="size-4 shrink-0" style={{ color: config.accentColor }} />
              <span className="text-lg font-bold leading-none">{row.counts.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{row.class}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
