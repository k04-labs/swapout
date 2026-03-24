type ScoreBadgeProps = {
  score?: number | null;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (typeof score !== "number") {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-400">
        N/A
      </span>
    );
  }

  let colorClasses = "border-violet-200 bg-violet-50 text-violet-700";
  if (score >= 4)
    colorClasses = "border-emerald-200 bg-emerald-50 text-emerald-700";
  else if (score >= 3) colorClasses = "border-sky-200 bg-sky-50 text-sky-700";
  else if (score < 2) colorClasses = "border-red-200 bg-red-50 text-red-600";
  else if (score < 3)
    colorClasses = "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      {score.toFixed(2)} / 5
    </span>
  );
}
