"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function DebugTheme() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [cssVars, setCssVars] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)

    // Get computed CSS variables
    const computedStyle = getComputedStyle(document.documentElement)
    setCssVars({
      "--background": computedStyle.getPropertyValue("--background"),
      "--foreground": computedStyle.getPropertyValue("--foreground"),
      "--card": computedStyle.getPropertyValue("--card"),
      "--popover": computedStyle.getPropertyValue("--popover"),
      "--primary": computedStyle.getPropertyValue("--primary"),
      "--secondary": computedStyle.getPropertyValue("--secondary"),
      theme: theme || "not set",
      resolvedTheme: resolvedTheme || "not resolved",
    })
  }, [theme, resolvedTheme])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-background text-foreground border rounded-md max-w-xs">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(cssVars, null, 2)}</pre>
    </div>
  )
}

