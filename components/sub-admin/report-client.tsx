"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompetencyBarChart } from "@/components/sub-admin/competency-bar-chart";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { ScoreTrendChart } from "@/components/sub-admin/score-trend-chart";
import { TrendIndicator } from "@/components/sub-admin/trend-indicator";
import { useAppQuery } from "@/hooks/query";

type ReportPayload = {
  message?: string;
  employee: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
  };
  report: {
    totalSubmissions: number;
    latestScore: number | null;
    latestRemark: string | null;
    latestRemarkScore: number | null;
    latestRemarkDescription: string | null;
    averageScore: number | null;
    trend: "improving" | "declining" | "stable" | null;
  } | null;
  submissions: Array<{
    id: string;
    submittedAt: string;
    totalScore: number;
    remark: string;
    remarkScore: number;
    _count: {
      responses: number;
    };
  }>;
  trendSeries: Array<{
    date: string;
    score: number;
  }>;
  competencyAverage: Record<string, number>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toLabel(category: string): string {
  return category.replaceAll("_", " ");
}

export function ReportClient({ employeeId }: { employeeId: string }) {
  const reportQuery = useAppQuery<ReportPayload>({
    queryKey: ["sub-admin-report", employeeId],
    url: `/api/sub-admin/employees/${employeeId}/report`,
    fallbackError: "Failed to load report.",
  });
  const data = reportQuery.data;
  const loading = reportQuery.isLoading;
  const error = reportQuery.error?.message ?? null;

  const competencyData = useMemo(() => {
    if (!data) return [];

    return Object.entries(data.competencyAverage).map(([key, score]) => ({
      category: toLabel(key),
      score,
    }));
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];

    return data.trendSeries.map((item) => ({
      date: formatDate(item.date),
      score: item.score,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`report-stat-${index}`} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200/80 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Report unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl text-foreground">
            {data.employee.fullName}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.employee.department} · {data.employee.jobRole} ·{" "}
            {data.employee.site}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/sub-admin/employees/${employeeId}/export/csv`}>
              Export CSV
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/sub-admin/employees/${employeeId}/report/print`}
              target="_blank"
              rel="noreferrer"
            >
              Print Report
            </a>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Submissions
          </p>
          <p className="mt-1 font-heading text-2xl text-foreground">
            {data.report?.totalSubmissions ?? 0}
          </p>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest Score
          </p>
          <div className="mt-1">
            <ScoreBadge score={data.report?.latestScore ?? null} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Average Score
          </p>
          <div className="mt-1">
            <ScoreBadge score={data.report?.averageScore ?? null} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest Remark
          </p>
          <div className="mt-1">
            <RemarkBadge
              remarkScore={data.report?.latestRemarkScore ?? null}
              remark={data.report?.latestRemark ?? null}
            />
          </div>
        </div>
      </section>

      {/* Trend summary */}
      <div className="rounded-md border border-border bg-card p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Trend Summary
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <TrendIndicator trend={data.report?.trend ?? "stable"} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.report?.latestRemarkDescription ??
            "No remark description available yet."}
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Score Trend
          </h3>
          <ScoreTrendChart data={trendData} />
        </div>
        <div className="rounded-md border border-border bg-card p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Competency Breakdown
          </h3>
          <CompetencyBarChart data={competencyData} />
        </div>
      </div>

      {/* Assessment history */}
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Assessment History
          </h3>
        </div>
        {data.submissions.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No submissions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Remark
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Questions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="text-foreground">
                    {formatDate(submission.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={submission.totalScore} />
                  </TableCell>
                  <TableCell>
                    <RemarkBadge
                      remarkScore={submission.remarkScore}
                      remark={submission.remark}
                    />
                  </TableCell>
                  <TableCell className="text-foreground">
                    {submission._count.responses}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
