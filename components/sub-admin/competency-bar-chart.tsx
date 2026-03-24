"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/lib/theme";

type CompetencyPoint = {
  category: string;
  score: number;
};

type CompetencyBarChartProps = {
  data: CompetencyPoint[];
};

export function CompetencyBarChart({ data }: CompetencyBarChartProps) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#27272a" : "#f1f5f9";
  const tickColor = theme === "dark" ? "#71717a" : "#94a3b8";
  const barFill = theme === "dark" ? "rgba(124,58,237,0.25)" : "#ede9fe";
  const tooltipBorder = theme === "dark" ? "#3f3f46" : "#e2e8f0";
  const tooltipBg = theme === "dark" ? "#18181b" : "#ffffff";
  const tooltipText = theme === "dark" ? "#e4e4e7" : "#0f172a";

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No competency data yet.</p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 48 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="category"
            angle={-20}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11, fill: tickColor }}
          />
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
          <Bar
            dataKey="score"
            fill={barFill}
            radius={[4, 4, 0, 0]}
            activeBar={{ fill: "#7c3aed" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
