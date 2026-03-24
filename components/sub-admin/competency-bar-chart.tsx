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

type CompetencyPoint = {
  category: string;
  score: number;
};

type CompetencyBarChartProps = {
  data: CompetencyPoint[];
};

export function CompetencyBarChart({ data }: CompetencyBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No competency data yet.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -12, bottom: 48 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="category"
            angle={-20}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,.06)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="score"
            fill="#ede9fe"
            radius={[4, 4, 0, 0]}
            activeBar={{ fill: "#7c3aed" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
