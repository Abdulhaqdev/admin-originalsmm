import { useEffect, useState } from "react";
import { getDashboardStatistics } from "@/lib/apiservice";
import { getErrorMessage } from "@/lib/error-utils";

type Metrics = {
  orders: { current: number; previous: number };
  revenue: { current: number; previous: number };
  services: { current: number; previous: number };
  users: { current: number; previous: number };
};

const emptyMetrics: Metrics = {
  orders: { current: 0, previous: 0 },
  revenue: { current: 0, previous: 0 },
  services: { current: 0, previous: 0 },
  users: { current: 0, previous: 0 },
};

export function useDashboardStats(predefinedRange: string) {
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [chartData, setChartData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const range = predefinedRange === "all" ? undefined : predefinedRange.toUpperCase();
        const response = await getDashboardStatistics(range);
        if (!cancelled) {
          setMetrics(response.metrics);
          setChartData(response.chartData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to fetch dashboard data. Please try again later."));
          setMetrics(emptyMetrics);
          setChartData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [predefinedRange]);

  return { metrics, chartData, error, isLoading };
}
