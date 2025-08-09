// contexts/date-context.tsx
"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { getDashboardStatistics } from '@/lib/apiservice'
// import { getDashboardStatistics } from "@/lib/apiService";

type PredefinedRange = "1d" | "7d" | "30d" | "90d" | "all";

interface DateContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  predefinedRange: PredefinedRange;
  setPredefinedRange: (range: PredefinedRange) => void;
  hasDataForRange: boolean;
  getPercentChange: (current: number, previous: number) => number;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [predefinedRange, setPredefinedRange] = useState<PredefinedRange>("30d");
  const [hasDataForRange, setHasDataForRange] = useState(true);

  useEffect(() => {
    const checkDataAvailability = async () => {
      try {
        const range = predefinedRange === "all" ? undefined : predefinedRange.toUpperCase();
        const response = await getDashboardStatistics(range);
        setHasDataForRange(response.chartData.length > 0);
      } catch (error) {
        setHasDataForRange(false);
      }
    };

    checkDataAvailability();
  }, [predefinedRange]);

  const getPercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <DateContext.Provider
      value={{
        dateRange,
        setDateRange,
        predefinedRange,
        setPredefinedRange,
        hasDataForRange,
        getPercentChange,
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDateContext must be used within a DateProvider");
  }
  return context;
}