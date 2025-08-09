"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/components/ui/form"

interface DurationInputProps {
  value: number // Duration in seconds
  onChange: (duration: number) => void
  label?: string
  error?: string
  required?: boolean
}

export function DurationInput({ value, onChange, label, error, required = false }: DurationInputProps) {
  const [hours, setHours] = useState(Math.floor(value / 3600))
  const [minutes, setMinutes] = useState(Math.floor((value % 3600) / 60))
  const [seconds, setSeconds] = useState(value % 60)
  const [internalValue, setInternalValue] = useState(value)

  // Update local state when value prop changes
  useEffect(() => {
    if (value !== internalValue) {
      setHours(Math.floor(value / 3600))
      setMinutes(Math.floor((value % 3600) / 60))
      setSeconds(value % 60)
      setInternalValue(value)
    }
  }, [value, internalValue])

  // Only call onChange when internal values change
  useEffect(() => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    if (totalSeconds !== internalValue) {
      setInternalValue(totalSeconds)
      onChange(totalSeconds)
    }
  }, [hours, minutes, seconds, onChange, internalValue])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<number>>,
    max: number,
  ) => {
    const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= max) {
      setter(value)
    }
  }

  // Format the duration for display
  const formatDuration = () => {
    const parts = []
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
    if (seconds > 0) parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`)
    return parts.length > 0 ? parts.join(" ") : "0 seconds"
  }

  return (
    <div className="grid gap-2">
      {label && (
        <Label htmlFor="duration">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <div className="grid gap-1">
          <Input
            type="number"
            id="hours"
            value={hours || ""}
            onChange={(e) => handleInputChange(e, setHours, 999)}
            min={0}
            max={999}
            className="w-20"
            aria-label="Hours"
          />
          <span className="text-xs text-center text-muted-foreground">Hours</span>
        </div>
        <div className="grid gap-1">
          <Input
            type="number"
            id="minutes"
            value={minutes || ""}
            onChange={(e) => handleInputChange(e, setMinutes, 59)}
            min={0}
            max={59}
            className="w-20"
            aria-label="Minutes"
          />
          <span className="text-xs text-center text-muted-foreground">Minutes</span>
        </div>
        <div className="grid gap-1">
          <Input
            type="number"
            id="seconds"
            value={seconds || ""}
            onChange={(e) => handleInputChange(e, setSeconds, 59)}
            min={0}
            max={59}
            className="w-20"
            aria-label="Seconds"
          />
          <span className="text-xs text-center text-muted-foreground">Seconds</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{formatDuration()}</p>
      {error && <FormMessage>{error}</FormMessage>}
    </div>
  )
}

