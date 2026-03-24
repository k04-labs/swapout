"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/sub-admin/employees/${employeeId}/report`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as ReportPayload;
        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load report.");
        }

        if (mounted) setData(payload);
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load report.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

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
      <div className="rounded-md border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200/80 bg-red-50/40 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">Report unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl text-slate-900">
            {data.employee.fullName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
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
        <div className="rounded-md border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Submissions
          </p>
          <p className="mt-1 font-heading text-2xl text-slate-900">
            {data.report?.totalSubmissions ?? 0}
          </p>
        </div>
        <div className="rounded-md border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Latest Score
          </p>
          <div className="mt-1">
            <ScoreBadge score={data.report?.latestScore ?? null} />
          </div>
        </div>
        <div className="rounded-md border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Average Score
          </p>
          <div className="mt-1">
            <ScoreBadge score={data.report?.averageScore ?? null} />
          </div>
        </div>
        <div className="rounded-md border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
      <div className="rounded-md border border-slate-200/80 bg-white p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Trend Summary
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <TrendIndicator trend={data.report?.trend ?? "stable"} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {data.report?.latestRemarkDescription ??
            "No remark description available yet."}
        </p>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200/80 bg-white p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Score Trend
          </h3>
          <ScoreTrendChart data={trendData} />
        </div>
        <div className="rounded-md border border-slate-200/80 bg-white p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Competency Breakdown
          </h3>
          <CompetencyBarChart data={competencyData} />
        </div>
      </div>

      {/* Assessment history */}
      <div className="rounded-md border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Assessment History
          </h3>
        </div>
        {data.submissions.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-400">
            No submissions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Remark
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Questions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="text-slate-700">
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
                  <TableCell className="text-slate-700">
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
