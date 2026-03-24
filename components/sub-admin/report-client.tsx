"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompetencyBarChart } from "@/components/sub-admin/competency-bar-chart";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { ScoreTrendChart } from "@/components/sub-admin/score-trend-chart";
import { TrendIndicator } from "@/components/sub-admin/trend-indicator";
import { cn } from "@/lib/utils";

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
        const response = await fetch(`/api/sub-admin/employees/${employeeId}/report`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as ReportPayload;
        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load report.");
        }

        if (mounted) setData(payload);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load report.");
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
    return <p className="text-sm text-slate-500">Loading report...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Report unavailable.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{data.employee.fullName} • Progress Report</CardTitle>
            <p className="text-sm text-slate-500">
              {data.employee.department} · {data.employee.jobRole} · {data.employee.site}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/sub-admin/employees/${employeeId}/export/csv`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Export CSV
            </a>
            <a
              href={`/sub-admin/employees/${employeeId}/report/print`}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Print Report
            </a>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{data.report?.totalSubmissions ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Latest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={data.report?.latestScore ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={data.report?.averageScore ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Latest Remark</CardTitle>
          </CardHeader>
          <CardContent>
            <RemarkBadge
              remarkScore={data.report?.latestRemarkScore ?? null}
              remark={data.report?.latestRemark ?? null}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Trend Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TrendIndicator trend={data.report?.trend ?? "stable"} />
          <p className="text-sm text-slate-600">
            {data.report?.latestRemarkDescription ?? "No remark description available yet."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreTrendChart data={trendData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competency Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetencyBarChart data={competencyData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          {data.submissions.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Remark</th>
                    <th className="px-3 py-2">Questions Answered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.map((submission) => (
                    <tr key={submission.id} className="border-t border-slate-200">
                      <td className="px-3 py-2">{formatDate(submission.submittedAt)}</td>
                      <td className="px-3 py-2">
                        <ScoreBadge score={submission.totalScore} />
                      </td>
                      <td className="px-3 py-2">
                        <RemarkBadge remarkScore={submission.remarkScore} remark={submission.remark} />
                      </td>
                      <td className="px-3 py-2 text-slate-700">{submission._count.responses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
