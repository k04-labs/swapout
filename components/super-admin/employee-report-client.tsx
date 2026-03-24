"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompetencyBarChart } from "@/components/sub-admin/competency-bar-chart";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { ScoreTrendChart } from "@/components/sub-admin/score-trend-chart";
import { TrendIndicator } from "@/components/sub-admin/trend-indicator";

type Payload = {
  employee: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
    subAdmin: {
      id: string;
      name: string;
      email: string;
      approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    };
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
    remark: string;
  }>;
  competencyAverage: Record<string, number>;
  message?: string;
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

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`stats-${index}`}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={`history-${index}`} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminEmployeeReportClient({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/super-admin/employees/${employeeId}/report`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as Payload;
        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load employee report.");
        }

        if (mounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load employee report.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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
    return data.trendSeries.map((point) => ({
      date: formatDate(point.date),
      score: point.score,
    }));
  }, [data]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (!data || error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load employee report</CardTitle>
          <CardDescription>{error ?? "No report data available."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{data.employee.fullName}</CardTitle>
            <CardDescription>
              {data.employee.department} · {data.employee.jobRole} · {data.employee.site}
            </CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              Managed by {data.employee.subAdmin.name} ({data.employee.subAdmin.email})
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href="/api/super-admin/export/csv">
                <Download data-icon="inline-start" />
                Export Platform CSV
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`/super-admin/employees/${employeeId}/report/print`}
                target="_blank"
                rel="noreferrer"
              >
                <Printer data-icon="inline-start" />
                Print Report
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/super-admin/employees/${employeeId}`}>
                <ArrowLeft data-icon="inline-start" />
                Back To Profile
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl text-foreground">{data.report?.totalSubmissions ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Latest Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={data.report?.latestScore ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={data.report?.averageScore ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Trend</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendIndicator trend={data.report?.trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Remark</CardTitle>
          <CardDescription>Current behavioral safety band and interpretation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <RemarkBadge
            remarkScore={data.report?.latestRemarkScore ?? null}
            remark={data.report?.latestRemark ?? null}
          />
          <p className="text-sm text-muted-foreground">
            {data.report?.latestRemarkDescription ?? "No remark context available yet."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
            <CardDescription>Progress over the complete submission history.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competency Breakdown</CardTitle>
            <CardDescription>Average category score across all submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <CompetencyBarChart data={competencyData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>Chronological record of all submissions and response depth.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Responses</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    No submissions yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <ScoreBadge score={submission.totalScore} />
                    </TableCell>
                    <TableCell>
                      <RemarkBadge remarkScore={submission.remarkScore} remark={submission.remark} />
                    </TableCell>
                    <TableCell>{submission._count.responses}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
