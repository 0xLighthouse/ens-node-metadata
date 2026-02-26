'use client'

import { useMemo, useState, useEffect } from 'react'
import { ExternalLink, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useTreeData } from '@/hooks/useTreeData'
import { useSchemaStore } from '@/stores/schemas'
import { useTreeEditStore } from '@/stores/tree-edits'
import type { TreeNode } from '@/lib/tree/types'
import { shortAddress } from '@/lib/shortAddress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarFallback } from '@/lib/getAvatarFallback'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenTree(node: TreeNode, depth = 0): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = []
  result.push({ node, depth })
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child, depth + 1))
    }
  }
  return result
}

type SortKey = 'name' | 'parent' | 'fullPath' | 'class' | 'address'
type SortDir = 'asc' | 'desc' | null

function useSortState(initial: SortKey) {
  const [key, setKey] = useState<SortKey>(initial)
  const [dir, setDir] = useState<SortDir>(null)

  const toggle = (col: SortKey) => {
    if (key !== col) {
      setKey(col)
      setDir('asc')
    } else if (dir === null) {
      setDir('asc')
    } else if (dir === 'asc') {
      setDir('desc')
    } else {
      setDir(null)
    }
  }

  return { key, dir, toggle }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SortIcon({ col, sortKey, dir }: { col: string; sortKey: string; dir: SortDir }) {
  if (col !== sortKey || dir === null) return <ChevronsUpDown size={14} className="text-gray-400" />
  if (dir === 'asc') return <ChevronUp size={14} className="text-indigo-500" />
  return <ChevronDown size={14} className="text-indigo-500" />
}

function ClassBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Agent: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    Treasury: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Signer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Delegate: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Person: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    Org: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Application: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  }
  const cls = colorMap[label] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
      {label}
    </span>
  )
}

function StatusBadge({ node }: { node: TreeNode }) {
  if (node.isPendingCreation)
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
        Pending creation
      </span>
    )
  if (node.isSuggested)
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        Suggested
      </span>
    )
  return (
    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      Live
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TablePage() {
  const { sourceTree, isLoading, hasHydrated, loadTree } = useTreeData()
  const { schemas, fetchSchemas } = useSchemaStore()
  const { pendingMutations } = useTreeEditStore()
  const [search, setSearch] = useState('')

  // Trigger tree and schema loading on mount
  useEffect(() => {
    if (!hasHydrated) return
    void loadTree()
  }, [hasHydrated, loadTree])

  useEffect(() => {
    if (schemas.length === 0) void fetchSchemas()
  }, [schemas.length, fetchSchemas])
  const { key: sortKey, dir: sortDir, toggle: toggleSort } = useSortState('name')

  const rows = useMemo(() => {
    if (!sourceTree) return []
    return flattenTree(sourceTree)
  }, [sourceTree])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(({ node }) => {
      const currentClass = ((node as any).class || node.texts?.class) as string | undefined
      const mutation = pendingMutations.get(node.name)
      const pendingClass = mutation?.changes?.class as string | undefined
      const classToSearch = pendingClass || currentClass
      const parentPath = node.name.split('.').slice(1).join('.')
      return (
        node.name.toLowerCase().includes(q) ||
        parentPath.toLowerCase().includes(q) ||
        (classToSearch?.toLowerCase().includes(q) ?? false) ||
        (node.address?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [rows, search, pendingMutations])

  const sorted = useMemo(() => {
    if (sortDir === null) return filtered
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort(({ node: a }, { node: b }) => {
      switch (sortKey) {
        case 'name': {
          const nameA = a.name.split('.')[0]
          const nameB = b.name.split('.')[0]
          return dir * nameA.localeCompare(nameB)
        }
        case 'parent': {
          const parentA = a.name.split('.').slice(1).join('.')
          const parentB = b.name.split('.').slice(1).join('.')
          return dir * parentA.localeCompare(parentB)
        }
        case 'fullPath':
          return dir * a.name.localeCompare(b.name)
        case 'class': {
          const currentClassA = ((a as any).class || a.texts?.class) ?? ''
          const currentClassB = ((b as any).class || b.texts?.class) ?? ''
          const mutation = pendingMutations.get(a.name)
          const pendingClassA = mutation?.changes?.class as string | undefined
          const mutation2 = pendingMutations.get(b.name)
          const pendingClassB = mutation2?.changes?.class as string | undefined
          const ca = pendingClassA || currentClassA
          const cb = pendingClassB || currentClassB
          return dir * ca.localeCompare(cb)
        }
        case 'address':
          return dir * ((a.address ?? '').localeCompare(b.address ?? ''))
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir, pendingMutations])

  const schemaById = useMemo(
    () => new Map(schemas.map((s) => [s.id, s])),
    [schemas],
  )

  // Helper to get pending class value if it exists
  const getPendingClassChange = (nodeName: string): string | null => {
    const mutation = pendingMutations.get(nodeName)
    if (!mutation || mutation.createNode) return null

    // Check if 'class' is in the changes
    if (mutation.changes && 'class' in mutation.changes) {
      return mutation.changes.class as string
    }
    return null
  }

  function ColHeader({
    col,
    label,
  }: {
    col: SortKey
    label: string
  }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} sortKey={sortKey} dir={sortDir} />
        </span>
      </th>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading nodes…</p>
      </div>
    )
  }

  if (!sourceTree) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">No tree data available.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6 gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            type="text"
            placeholder="Filter by name, class or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {sorted.length} of {rows.length} nodes
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 sticky top-0 z-10">
            <tr>
              <ColHeader col="name" label="Name" />
              <ColHeader col="parent" label="Parent" />
              <ColHeader col="fullPath" label="Full Path" />
              <ColHeader col="class" label="Class" />
              <ColHeader col="address" label="Address" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Owner
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No nodes match your search.
                </td>
              </tr>
            ) : (
              sorted.map(({ node, depth }) => {
                const classLabel = ((node as any).class || node.texts?.class) as string | undefined
                const schemaId = (node as any).schema || node.texts?.schema
                const schema = schemaId ? schemaById.get(schemaId) : undefined
                const ensUrl = `https://app.ens.domains/${node.name}`
                const addressUrl = node.address
                  ? `https://etherscan.io/address/${node.address}`
                  : null
                const ownerUrl = `https://etherscan.io/address/${node.owner}`
                const displayName = node.name.split('.')[0]
                const parentPath = node.name.split('.').slice(1).join('.') || '—'
                const fullPath = node.name

                return (
                  <tr
                    key={node.name}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                        {displayName}
                      </span>
                    </td>

                    {/* Parent */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {parentPath}
                      </span>
                    </td>

                    {/* Full Path */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                          {fullPath}
                        </span>
                        <a
                          href={ensUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex-shrink-0"
                          title="Open in ENS app"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(() => {
                        const currentClass = classLabel
                        const pendingClass = getPendingClassChange(node.name)
                        const displayClass = pendingClass || currentClass
                        const hasPendingClassChange = !!pendingClass

                        if (!displayClass) {
                          return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        }

                        return (
                          <div className="flex items-center gap-1.5">
                            <div
                              className={hasPendingClassChange ? 'relative' : ''}
                              title={hasPendingClassChange ? `Class will change to "${displayClass}"` : ''}
                            >
                              {hasPendingClassChange && (
                                <div className="absolute -inset-1 bg-orange-100 dark:bg-orange-900/20 rounded-full" />
                              )}
                              <div className="relative">
                                <ClassBadge label={displayClass} />
                              </div>
                            </div>
                            {hasPendingClassChange && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400" title="Pending change" />
                            )}
                          </div>
                        )
                      })()}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {node.address ? (
                        <a
                          href={addressUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-mono text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {shortAddress(node.address)}
                          <ExternalLink size={10} className="text-gray-400" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={ownerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <Avatar className="size-4 flex-shrink-0">
                          <AvatarImage
                            src={node.ownerEnsAvatar || `https://avatar.vercel.sh/${node.owner}`}
                          />
                          <AvatarFallback className="text-[8px] font-medium bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                            {getAvatarFallback(node.owner)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          style={{ fontFamily: node.ownerEnsName ? 'inherit' : 'monospace' }}
                        >
                          {node.ownerEnsName || shortAddress(node.owner)}
                        </span>
                        <ExternalLink size={10} className="text-gray-400" />
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
