"use client"

import dynamic from "next/dynamic"
import { Collapsible as RadixCollapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Create a client-side only version of Collapsible
const ClientCollapsible = dynamic(() => Promise.resolve(RadixCollapsible), { ssr: false })

export { ClientCollapsible, CollapsibleContent, CollapsibleTrigger }

