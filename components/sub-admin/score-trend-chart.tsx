"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/lib/theme";

type TrendPoint = {
  date: string;
  score: number;
};

type ScoreTrendChartProps = {
  data: TrendPoint[];
};

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#27272a" : "#f1f5f9";
  const tickColor = theme === "dark" ? "#71717a" : "#94a3b8";
  const tooltipBorder = theme === "dark" ? "#3f3f46" : "#e2e8f0";
  const tooltipBg = theme === "dark" ? "#18181b" : "#ffffff";
  const tooltipText = theme === "dark" ? "#e4e4e7" : "#0f172a";

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No trend data yet.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: tickColor }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${tooltipBorder}`,
              backgroundColor: tooltipBg,
              color: tooltipText,
              boxShadow: "0 4px 12px rgba(0,0,0,.06)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ r: 3, fill: "#7c3aed" }}
            activeDot={{ r: 5, fill: "#7c3aed" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
