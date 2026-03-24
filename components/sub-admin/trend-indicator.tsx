import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

type Trend = "improving" | "declining" | "stable" | null | undefined;

type TrendIndicatorProps = {
  trend: Trend;
};

export function TrendIndicator({ trend }: TrendIndicatorProps) {
  if (trend === "improving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <ArrowUpRight className="h-3.5 w-3.5" />
        Improving
      </span>
    );
  }

  if (trend === "declining") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
        <ArrowDownRight className="h-3.5 w-3.5" />
        Declining
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      <ArrowRight className="h-3.5 w-3.5" />
      Stable
    </span>
  );
}
