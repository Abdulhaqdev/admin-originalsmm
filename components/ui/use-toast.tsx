"use client"

import type React from "react"

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

export function toast(props: ToastProps) {
  const { title, description, variant, action } = props

  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action,
    })
  }

  return sonnerToast(title, {
    description,
    action,
  })
}

export { SonnerToaster as Toaster }

