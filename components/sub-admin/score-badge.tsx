type ScoreBadgeProps = {
  score?: number | null;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (typeof score !== "number") {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        N/A
      </span>
    );
  }

  let colorClasses =
    "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400";
  if (score >= 4)
    colorClasses =
      "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
  else if (score >= 3)
    colorClasses =
      "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400";
  else if (score < 2)
    colorClasses =
      "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400";
  else if (score < 3)
    colorClasses =
      "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      {score.toFixed(2)} / 5
    </span>
  );
}
