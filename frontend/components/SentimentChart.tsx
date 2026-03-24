"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  date: string;
  avg_sentiment: number;
  post_count: number;
}

export default function SentimentChart({ data }: { data: TrendData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        No trend data available yet
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="date"
          className="text-xs fill-slate-500"
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          className="text-xs fill-slate-500"
          tickLine={false}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--tooltip-bg, #fff)",
            border: "1px solid var(--tooltip-border, #e2e8f0)",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#475569" }}
          formatter={(value: number, name: string) => [
            name === "avg_sentiment" ? value.toFixed(3) : value,
            name === "avg_sentiment" ? "Sentiment" : "Posts",
          ]}
        />
        <Line
          type="monotone"
          dataKey="avg_sentiment"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ fill: "#0ea5e9", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#0284c7" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
