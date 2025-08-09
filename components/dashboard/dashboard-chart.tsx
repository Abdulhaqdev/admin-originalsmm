// components/dashboard/dashboard-chart.tsx
"use client";

import { Bar, Line, Area } from "recharts";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface DashboardChartProps {
  chartType: "bar" | "line" | "area";
  chartData: { date: string; orders: number; revenue: number }[];
}

export function DashboardChart({ chartType, chartData }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        {chartType === "bar" && (
          <>
            <Bar yAxisId="left" dataKey="orders" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" />
          </>
        )}
        {chartType === "line" && (
          <>
            <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
          </>
        )}
        {chartType === "area" && (
          <>
            <Area yAxisId="left" type="monotone" dataKey="orders" fill="#8884d8" stroke="#8884d8" />
            <Area yAxisId="right" type="monotone" dataKey="revenue" fill="#82ca9d" stroke="#82ca9d" />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}