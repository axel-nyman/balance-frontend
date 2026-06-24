import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useArchiveGoal } from '@/hooks'
import type { SavingsGoal } from '@/api/types'

interface ArchiveGoalDialogProps {
  goal: SavingsGoal
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchived?: () => void
}

export function ArchiveGoalDialog({
  goal,
  open,
  onOpenChange,
  onArchived,
}: ArchiveGoalDialogProps) {
  const archive = useArchiveGoal(goal.id)
  const [releaseToBalance, setReleaseToBalance] = useState(false)

  useEffect(() => {
    if (open) setReleaseToBalance(false)
  }, [open])

  const handleArchive = async () => {
    try {
      await archive.mutateAsync({ releaseToBalance })
      toast.success('Goal archived')
      onOpenChange(false)
      onArchived?.()
    } catch {
      // Error surfaced inline via archive.error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive “{goal.name}”?</DialogTitle>
          <DialogDescription>
            Archiving frees this goal's earmarked money. The goal moves out of your active
            list, but its allocation history is kept.
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
          <Checkbox
            checked={releaseToBalance}
            onCheckedChange={(checked) => setReleaseToBalance(checked === true)}
            className="mt-0.5"
          />
          <span className="space-y-1">
            <Label className="font-medium cursor-pointer">
              Also spend the money
            </Label>
            <span className="block text-sm text-muted-foreground">
              The goal was a real expense that's now paid — deduct the allocated amount from each
              backing account's balance. Leave unchecked to simply free the earmark and keep
              balances unchanged.
            </span>
          </span>
        </label>

        {archive.error && <p className="text-sm text-destructive">{archive.error.message}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={archive.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleArchive} disabled={archive.isPending}>
            {archive.isPending ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
