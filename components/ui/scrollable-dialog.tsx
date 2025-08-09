import type React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ScrollableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer: React.ReactNode
}

export function ScrollableDialog({ open, onOpenChange, title, description, children, footer }: ScrollableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">{children}</div>
        <DialogFooter className="flex-shrink-0 mt-4">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

