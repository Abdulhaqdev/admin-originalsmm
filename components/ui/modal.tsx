import type React from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showCloseButton?: boolean
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
  size = "md",
}: ModalProps) {
  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    full: "sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100vh-2rem)]",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] flex flex-col", sizeClasses[size], className)}>
        {(title || description) && (
          <DialogHeader className="flex-shrink-0">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {showCloseButton && (
          <Button variant="ghost" size="icon" className="absolute " onClick={() => onOpenChange(false)}>
            {/* <X className="h-4 w-4" /> */}
            {/* <span className="sr-only">Close</span> */}
          </Button>
        )}
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">{children}</div>
        {footer && <div className="flex-shrink-0 mt-4 pt-4 border-t">{footer}</div>}
      </DialogContent>
    </Dialog>
  )
}

