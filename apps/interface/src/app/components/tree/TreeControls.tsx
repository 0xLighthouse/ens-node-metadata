'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTreeStore } from '@/stores/tree'
import { useTreeData, type DomainTreeNode } from '@/contexts/TreeDataContext'
import { SuggestionsDialog } from './SuggestionsDialog'

export function TreeControls() {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const { previewTree } = useTreeData()
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
  } = useTreeStore()

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
    const allNodesWithChildren = getAllNodesWithChildren(previewTree)
    collapseAll(allNodesWithChildren)
  }

  const hasCollapsedNodes = collapsedNodes.size > 0

  return (
    <>
      {/* Suggestions button - top left */}
      <button
        onClick={() => setIsSuggestionsOpen(true)}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Suggestions
      </button>

      {/* Main controls - bottom left */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
      <button
        onClick={() => setViewMode(viewMode === 'full' ? 'compact' : 'full')}
        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        {viewMode === 'full' ? 'Compact View' : 'Show Full Tree'}
      </button>

      <button
        onClick={() => setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        Flip Tree
      </button>

      <button
        onClick={hasCollapsedNodes ? expandAll : handleCollapseAll}
        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        {hasCollapsedNodes ? 'Expand All' : 'Collapse All'}
      </button>

      <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
        <button
          onClick={zoomOut}
          className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-l-lg"
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
          className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-x border-gray-300 dark:border-gray-600"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          onClick={zoomIn}
          className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-r-lg"
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
