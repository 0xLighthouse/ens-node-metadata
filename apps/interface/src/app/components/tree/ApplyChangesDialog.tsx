'use client'

import { useState, useMemo, useEffect, useCallback, Fragment } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTreeEditStore } from '@/stores/tree-edits'
import { useTreeData } from '@/hooks/useTreeData'
import type { TreeNodeType } from '@/lib/tree/types'

interface ApplyChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (mutationIds: string[]) => void
}

export function ApplyChangesDialog({ open, onOpenChange, onConfirm }: ApplyChangesDialogProps) {
  const { pendingMutations } = useTreeEditStore()
  const { sourceTree } = useTreeData()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const changesArray = useMemo(() => Array.from(pendingMutations.values()), [pendingMutations])

  console.log('pendingMutations')
  console.log(pendingMutations)

  // Select all by default when dialog opens or mutations change
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(changesArray.map((c) => c.id)))
    }
  }, [open, changesArray])

  const findNode = useCallback(
    (name: string, node = sourceTree): any => {
      if (!node) return null
      if (node.name === name) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(name, child)
          if (found) return found
        }
      }
      return null
    },
    [sourceTree],
  )

  const groupedChanges = useMemo(() => {
    const groups = new Map<string, typeof changesArray>()
    for (const change of changesArray) {
      let resolverAddress: string
      if (change.isCreate) {
        resolverAddress = findNode(change.parentName ?? '')?.resolverAddress ?? 'unknown'
      } else {
        resolverAddress = findNode(change.nodeName ?? '')?.resolverAddress ?? 'unknown'
      }
      const existing = groups.get(resolverAddress)
      if (existing) {
        existing.push(change)
      } else {
        groups.set(resolverAddress, [change])
      }
    }
    return Array.from(groups.entries())
  }, [changesArray, findNode])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatNodeType = (nodeType?: string) => {
    if (!nodeType) return 'Unknown'
    const labels: Record<string, string> = {
      generic: 'Generic',
      default: 'Default',
      organizationRoot: 'Organization Root',
      treasury: 'Treasury',
      role: 'Role',
      team: 'Team',
    }
    return labels[nodeType] ?? nodeType
  }

  const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())

  // Flatten all nodes from a creation recursively
  const flattenNodes = (nodes: any[]): any[] => {
    const result: any[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) {
        result.push(...flattenNodes(node.children))
      }
    }
    return result
  }

  // Get key/value rows for a created node
  const getCreationRows = (node: any): { key: string; value: string }[] => {
    const rows: { key: string; value: string }[] = []
    if (node.schema) rows.push({ key: 'Schema', value: node.schema })
    if (node.nodeType) rows.push({ key: 'Type', value: formatNodeType(node.nodeType) })
    const fields = [
      'title',
      'kind',
      'description',
      'address',
      'website',
      'email',
      'organizationAddress',
    ]
    for (const f of fields) {
      if (node[f]) {
        rows.push({ key: formatKey(f), value: String(node[f]) })
      }
    }
    if (node.attributes) {
      for (const [k, v] of Object.entries(node.attributes)) {
        if (v != null && v !== '') rows.push({ key: k, value: String(v) })
      }
    }
    return rows
  }

  if (!sourceTree) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply Changes</DialogTitle>
        </DialogHeader>

        {/* Scrollable cards */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {groupedChanges.map(([resolverAddress, mutations]) => (
            <div key={resolverAddress}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-1 py-1.5 mb-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  Resolver:
                </span>
                {resolverAddress !== 'unknown' ? (
                  <a
                    href={`https://etherscan.io/address/${resolverAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Resolver on Etherscan"
                    className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 font-mono flex items-center gap-1"
                  >
                    {`${resolverAddress.slice(0, 6)}...${resolverAddress.slice(-4)}`}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    Unknown
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {mutations.map((change) => {
                  const isSelected = selectedIds.has(change.id)

                  if (change.isCreate) {
                    const allNodes = change.nodes ? flattenNodes(change.nodes) : []
                    const primaryNode = allNodes[0]

                    return (
                      <div
                        key={change.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(change.id)}
                          />
                          <span className="font-mono font-bold text-sm truncate">
                            {primaryNode?.name ?? change.parentName}
                          </span>
                          {primaryNode?.address && (
                            <a
                              href={`https://etherscan.io/address/${primaryNode.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono flex items-center gap-1 shrink-0"
                            >
                              {`${primaryNode.address.slice(0, 6)}...${primaryNode.address.slice(-4)}`}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800 text-[10px] px-1.5 py-0 shrink-0">
                            New
                          </Badge>
                        </div>

                        {/* Key/value table */}
                        <table className="w-full text-xs">
                          <tbody>
                            {allNodes.map((node, idx) => {
                              const rows = getCreationRows(node)
                              return (
                                <Fragment key={idx}>
                                  {allNodes.length > 1 && (
                                    <tr>
                                      <td
                                        colSpan={2}
                                        className={`py-1.5 font-mono font-semibold text-gray-700 dark:text-gray-300 ${idx > 0 ? 'pt-3' : ''}`}
                                      >
                                        {node.name}
                                      </td>
                                    </tr>
                                  )}
                                  {rows.map(({ key, value }) => (
                                    <tr
                                      key={`${idx}-${key}`}
                                      className="border-t border-gray-100 dark:border-gray-800"
                                    >
                                      <td className="py-1 pr-3 text-gray-500 dark:text-gray-400 font-medium w-36 align-top">
                                        {key}
                                      </td>
                                      <td className="py-1 text-green-600 dark:text-green-400 break-all">
                                        {value}
                                      </td>
                                    </tr>
                                  ))}
                                </Fragment>
                              )
                            })}
                          </tbody>
                        </table>

                        {/* Per-card Save */}
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onConfirm([change.id])}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )
                  }

                  // Edit mutation
                  const originalNode = change.nodeName ? findNode(change.nodeName) : null

                  const entries = change.changes
                    ? Object.entries(change.changes).filter(([key, newValue]) => {
                        const originalValue = (originalNode as any)?.[key]
                        if (newValue === originalValue) return false
                        if (newValue === null || newValue === undefined || newValue === '')
                          return false
                        if (key === 'inspectionData') return false
                        return true
                      })
                    : []

                  const addedFields = entries.filter(([key]) => {
                    const ov = (originalNode as any)?.[key]
                    return ov === undefined || ov === null || ov === ''
                  })

                  const modifiedFields = entries.filter(([key]) => {
                    const ov = (originalNode as any)?.[key]
                    return ov !== undefined && ov !== null && ov !== ''
                  })

                  return (
                    <div
                      key={change.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(change.id)}
                        />
                        <span className="font-mono font-bold text-sm truncate">
                          {change.nodeName}
                        </span>
                        {originalNode?.address && (
                          <a
                            href={`https://etherscan.io/address/${originalNode.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono flex items-center gap-1 shrink-0"
                          >
                            {`${originalNode.address.slice(0, 6)}...${originalNode.address.slice(-4)}`}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800 text-[10px] px-1.5 py-0 shrink-0">
                          Modified
                        </Badge>
                      </div>

                      {/* Key/value table */}
                      <table className="w-full text-xs">
                        <tbody>
                          {addedFields.map(([key, newValue]) => (
                            <tr key={key} className="border-t border-gray-100 dark:border-gray-800">
                              <td className="py-1 pr-3 text-gray-500 dark:text-gray-400 font-medium w-36 align-top">
                                {formatKey(key)}
                              </td>
                              <td className="py-1 text-green-600 dark:text-green-400 break-all">
                                {String(newValue)}
                              </td>
                            </tr>
                          ))}
                          {modifiedFields.map(([key, newValue]) => {
                            const originalValue = (originalNode as any)?.[key]
                            return (
                              <tr
                                key={key}
                                className="border-t border-gray-100 dark:border-gray-800"
                              >
                                <td className="py-1 pr-3 text-gray-500 dark:text-gray-400 font-medium w-36 align-top">
                                  {formatKey(key)}
                                </td>
                                <td className="py-1 break-all">
                                  <span className="text-red-500 dark:text-red-400 line-through mr-2">
                                    {String(originalValue)}
                                  </span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {String(newValue)}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      {/* Per-card Save */}
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" onClick={() => onConfirm([change.id])}>
                          Save
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {selectedIds.size} of {changesArray.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(Array.from(selectedIds))}
              disabled={selectedIds.size === 0}
            >
              Save Selected ({selectedIds.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
