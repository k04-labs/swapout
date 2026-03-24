import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = "improving" | "declining" | "stable" | null | undefined;

type TrendIndicatorProps = {
  trend: Trend;
};

export function TrendIndicator({ trend }: TrendIndicatorProps) {
  if (trend === "improving") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-emerald-700")}>
        <ArrowUpRight className="h-4 w-4" />
        Improving
      </span>
    );
  }

  if (trend === "declining") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-red-600")}>
        <ArrowDownRight className="h-4 w-4" />
        Declining
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-slate-600")}>
      <ArrowRight className="h-4 w-4" />
      Stable
    </span>
  );
}
