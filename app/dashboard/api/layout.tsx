import { Toaster } from '@/components/ui/toaster'
import type { ReactNode } from "react"
// import { Toaster } from "@/components/ui/use-toast"

export default function ApiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

