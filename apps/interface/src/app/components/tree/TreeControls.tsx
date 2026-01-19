'use client'

import { useState } from 'react'
import { RefreshCcw, Sparkles } from 'lucide-react'
import { useTreeControlsStore } from '@/stores/tree-controls'
import { useTreeData } from '@/hooks/useTreeData'
import { type DomainTreeNode } from '@/lib/tree/types'
import { SuggestionsDialog } from './SuggestionsDialog'

export function TreeControls() {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const { previewTree, isLoading, isRefreshing, refreshTree, lastFetchedAt } = useTreeData()
  const {
    orientation,
    viewMode,
    zoomLevel,
    collapsedNodes,
    setOrientation,
    setViewMode,
    zoomIn,
    zoomOut,
    resetZoom,
    collapseAll,
    expandAll,
  } = useTreeControlsStore()

  // Collect all node names that have children
  const getAllNodesWithChildren = (node: DomainTreeNode): string[] => {
    const names: string[] = []
    if (node.children && node.children.length > 0) {
      names.push(node.name)
      node.children.forEach((child) => {
        names.push(...getAllNodesWithChildren(child))
      })
    }
    return names
  }

  const handleCollapseAll = () => {
    if (!previewTree) return
    const allNodesWithChildren = getAllNodesWithChildren(previewTree)
    collapseAll(allNodesWithChildren)
  }

  const controlsDisabled = isLoading || !previewTree
  const hasCollapsedNodes = collapsedNodes.size > 0
  const refreshTitle = lastFetchedAt
    ? `Last refreshed ${new Date(lastFetchedAt).toLocaleString()}`
    : 'Refresh tree data'
  const refreshLabel = lastFetchedAt
    ? `Updated ${new Date(lastFetchedAt).toLocaleString()}`
    : 'Not updated yet'

  return (
    <>
      {/* Suggestions + refresh - top left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsSuggestionsOpen(true)}
          disabled={controlsDisabled}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          Suggestions
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshTree()}
            disabled={isLoading || isRefreshing}
            title={refreshTitle}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isRefreshing}
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {refreshLabel}
          </span>
        </div>
      </div>

      {/* Main controls - bottom left */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setViewMode(viewMode === 'full' ? 'compact' : 'full')}
          disabled={controlsDisabled}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {viewMode === 'full' ? 'Compact View' : 'Show Full Tree'}
        </button>

        <button
          onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
          disabled={controlsDisabled}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Flip Tree
        </button>

        <button
          onClick={hasCollapsedNodes ? expandAll : handleCollapseAll}
          disabled={controlsDisabled}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasCollapsedNodes ? 'Expand All' : 'Collapse All'}
        </button>

        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
          <button
            onClick={zoomOut}
            disabled={controlsDisabled}
            className="px-3 py-2 text-gray-700 dark:text-gray-200 transition-colors rounded-l-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            onClick={resetZoom}
            disabled={controlsDisabled}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors border-x border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={controlsDisabled}
            className="px-3 py-2 text-gray-700 dark:text-gray-200 transition-colors rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      <SuggestionsDialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} />
    </>
  )
}
