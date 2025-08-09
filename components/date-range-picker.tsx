"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDateContext } from "@/contexts/date-context"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function DatePickerWithRange({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const { dateRange, setDateRange, predefinedRange, setPredefinedRange } = useDateContext()
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const handlePredefinedRangeChange = (value: string) => {
    if (!value) return

    const today = new Date()
    let newRange: DateRange | undefined

    switch (value) {
      case "1d":
        newRange = {
          from: today,
          to: today,
        }
        break
      case "7d":
        newRange = {
          from: subDays(today, 6),
          to: today,
        }
        break
      case "30d":
        newRange = {
          from: subDays(today, 29),
          to: today,
        }
        break
      case "60d":
        newRange = {
          from: subDays(today, 59),
          to: today,
        }
        break
      case "90d":
        newRange = {
          from: subDays(today, 89),
          to: today,
        }
        break
      case "all":
        // For all time, we set it to undefined to represent no filtering by date
        newRange = undefined
        break
      default:
        return
    }

    setDateRange(newRange)
    setPredefinedRange(value as any)
  }

  // const handleCalendarSelect = (range: DateRange | undefined) => {
  //   setDateRange(range)
  //   if (range?.from && range?.to) {
  //     setPredefinedRange("custom")
  //   }
  // }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 items-center">
        <ToggleGroup type="single" value={predefinedRange} onValueChange={handlePredefinedRangeChange}>
          <ToggleGroupItem value="1d">1D</ToggleGroupItem>
          <ToggleGroupItem value="7d">7D</ToggleGroupItem>
          <ToggleGroupItem value="30d">30D</ToggleGroupItem>
          <ToggleGroupItem value="60d">60D</ToggleGroupItem>
          <ToggleGroupItem value="90d">90D</ToggleGroupItem>
          <ToggleGroupItem value="all">All Time</ToggleGroupItem>
        </ToggleGroup>

        {/* <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !dateRange && predefinedRange !== "all" && "text-muted-foreground",
                predefinedRange === "custom" && "ring-1 ring-primary",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : predefinedRange === "all" ? (
                <span>All Time</span>
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover> */}
      </div>
    </div>
  )
}

