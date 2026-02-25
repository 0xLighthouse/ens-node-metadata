import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShieldAlert } from 'lucide-react'

interface NotAuthorizedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * The list of ENS node names the connected wallet is not authorized to edit.
   */
  unauthorizedNodes: string[]
}

/**
 * Shown when the connected wallet is not the Owner or Manager of one or more
 * nodes that have pending changes.
 */
export function NotAuthorizedDialog({
  open,
  onOpenChange,
  unauthorizedNodes,
}: NotAuthorizedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-red-700 dark:text-red-400">Not Authorized</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You must be the <span className="font-semibold">Owner</span> or{' '}
            <span className="font-semibold">Manager</span> of a node to publish changes to it.
          </p>

          {unauthorizedNodes.length > 0 && (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">
                {unauthorizedNodes.length === 1
                  ? 'The following node cannot be updated with the connected wallet:'
                  : 'The following nodes cannot be updated with the connected wallet:'}
              </p>
              <ul className="space-y-1">
                {unauthorizedNodes.map((name) => (
                  <li
                    key={name}
                    className="text-xs font-mono text-red-600 dark:text-red-400 truncate"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Switch to the wallet that owns or manages these nodes and try again.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
