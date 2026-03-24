import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

type Trend = "improving" | "declining" | "stable" | null | undefined;

type TrendIndicatorProps = {
  trend: Trend;
};

export function TrendIndicator({ trend }: TrendIndicatorProps) {
  if (trend === "improving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" />
        Improving
      </span>
    );
  }

  if (trend === "declining") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
        <ArrowDownRight className="h-3.5 w-3.5" />
        Declining
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      <ArrowRight className="h-3.5 w-3.5" />
      Stable
    </span>
  );
}
