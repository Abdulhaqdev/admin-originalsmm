// app/(root)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  AreaChart,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { useDateContext } from "@/contexts/date-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { getDashboardStatistics } from '@/lib/apiservice'
// import { getDashboardStatistics } from "@/lib/apiService";

export default function DashboardPage() {
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const { dateRange, hasDataForRange, getPercentChange, predefinedRange } = useDateContext();
  const [metrics, setMetrics] = useState({
    orders: { current: 0, previous: 0 },
    revenue: { current: 0, previous: 0 },
    services: { current: 0, previous: 0 },
    users: { current: 0, previous: 0 },
  });
  const [chartData, setChartData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const range = predefinedRange === "all" ? undefined : predefinedRange.toUpperCase();
        const response = await getDashboardStatistics(range);

        setMetrics(response.metrics);
        setChartData(response.chartData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard data. Please try again later.");
        setMetrics({
          orders: { current: 0, previous: 0 },
          revenue: { current: 0, previous: 0 },
          services: { current: 0, previous: 0 },
          users: { current: 0, previous: 0 },
        });
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [predefinedRange]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <DatePickerWithRange />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!hasDataForRange && dateRange?.from && dateRange?.to && !error && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no data available for the selected date range: {format(dateRange.from, "LLL dd, y")} -{" "}
            {format(dateRange.to, "LLL dd, y")}. Displaying zero values for all metrics.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.orders.current.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs">
              {metrics.orders.current > metrics.orders.previous ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : metrics.orders.current < metrics.orders.previous ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p
                className={`${
                  metrics.orders.current > metrics.orders.previous
                    ? "text-green-500"
                    : metrics.orders.current < metrics.orders.previous
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {hasDataForRange
                  ? `${getPercentChange(metrics.orders.current, metrics.orders.previous).toFixed(1)}% from previous period`
                  : "No change from previous period"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.revenue.current}</div>
            <div className="flex items-center space-x-1 text-xs">
              {metrics.revenue.current > metrics.revenue.previous ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : metrics.revenue.current < metrics.revenue.previous ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p
                className={`${
                  metrics.revenue.current > metrics.revenue.previous
                    ? "text-green-500"
                    : metrics.revenue.current < metrics.revenue.previous
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {hasDataForRange
                  ? `${getPercentChange(metrics.revenue.current, metrics.revenue.previous).toFixed(1)}% from previous period`
                  : "No change from previous period"}
              </p>
            </div>
          </CardContent>
        </Card>
     
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.current.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs">
              {metrics.users.current > metrics.users.previous ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : metrics.users.current < metrics.users.previous ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p
                className={`${
                  metrics.users.current > metrics.users.previous
                    ? "text-green-500"
                    : metrics.users.current < metrics.users.previous
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {hasDataForRange
                  ? `${getPercentChange(metrics.users.current, metrics.users.previous).toFixed(1)}% from previous period`
                  : "No change from previous period"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.services.current.toLocaleString()}</div>
            {/* <div className="flex items-center space-x-1 text-xs">
              {metrics.services.current > metrics.services.previous ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : metrics.services.current < metrics.services.previous ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p
                className={`${
                  metrics.services.current > metrics.services.previous
                    ? "text-green-500"
                    : metrics.services.current < metrics.services.previous
                      ? "text-red-500"
                      : "text-muted-foreground"
                }`}
              >
                {hasDataForRange
                  ? `${getPercentChange(metrics.services.current, metrics.services.previous).toFixed(1)}% from previous period`
                  : "No change from previous period"}
              </p>
            </div> */}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle>Orders Overview</CardTitle>
            <CardDescription>
              {dateRange?.from && dateRange?.to ? (
                <>
                  Order volume from {format(dateRange.from, "LLL dd, y")} to {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                "Daily order volume for the selected period"
              )}
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant={chartType === "bar" ? "default" : "outline"} size="sm" onClick={() => setChartType("bar")}>
              <BarChart className="h-4 w-4" />
            </Button>
            <Button variant={chartType === "line" ? "default" : "outline"} size="sm" onClick={() => setChartType("line")}>
              <LineChart className="h-4 w-4" />
            </Button>
            <Button variant={chartType === "area" ? "default" : "outline"} size="sm" onClick={() => setChartType("area")}>
              <AreaChart className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pl-2">
          <DashboardChart chartType={chartType} chartData={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}