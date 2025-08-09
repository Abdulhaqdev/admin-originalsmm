import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CloseButtonProps {
  onClick: () => void
}

export function CloseButton({ onClick }: CloseButtonProps) {
  return (
    <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClick}>
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  )
}

