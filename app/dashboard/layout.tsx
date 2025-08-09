"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"
import { DateProvider } from "@/contexts/date-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }

    // Listen for sidebar state changes
    const handleSidebarStateChange = () => {
      const currentState = localStorage.getItem("sidebarCollapsed")
      if (currentState !== null) {
        setIsCollapsed(currentState === "true")
      }
    }

    window.addEventListener("sidebarStateChange", handleSidebarStateChange)

    return () => {
      window.removeEventListener("sidebarStateChange", handleSidebarStateChange)
    }
  }, [])

  return (
    <DateProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className={cn("flex-1 transition-all duration-300 min-h-screen", isCollapsed ? "ml-16" : "ml-64")}>
          <div className="container mx-auto py-6 px-6 md:px-8 max-w-full">{children}</div>
        </main>
      </div>
    </DateProvider>
  )
}

