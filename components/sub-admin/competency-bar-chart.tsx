"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CompetencyPoint = {
  category: string;
  score: number;
};

type CompetencyBarChartProps = {
  data: CompetencyPoint[];
};

export function CompetencyBarChart({ data }: CompetencyBarChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No competency data yet.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="score" fill="#0284c7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
