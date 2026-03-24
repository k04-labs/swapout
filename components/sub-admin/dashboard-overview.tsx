"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { cn } from "@/lib/utils";

type DashboardStats = {
  metrics: {
    employeesCount: number;
    submissionsCount: number;
    averageScore: number;
    staleEmployeesCount: number;
  };
  recentSubmissions: Array<{
    id: string;
    totalScore: number;
    remark: string;
    remarkScore: number;
    submittedAt: string;
    employee: {
      id: string;
      fullName: string;
    };
  }>;
  recentEmployees: Array<{
    id: string;
    fullName: string;
    department: string;
    site: string;
    createdAt: string;
  }>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/sub-admin/dashboard/stats", {
          cache: "no-store",
        });

        const payload = (await response.json()) as DashboardStats & { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load dashboard stats.");
        }

        if (mounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard stats.");
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
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];

    return [
      { label: "Total Employees", value: data.metrics.employeesCount.toString() },
      { label: "Assessments Submitted", value: data.metrics.submissionsCount.toString() },
      { label: "Average Score", value: `${data.metrics.averageScore.toFixed(2)} / 5` },
      { label: "No Recent Assessment (30d)", value: data.metrics.staleEmployeesCount.toString() },
    ];
  }, [data]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500">No dashboard data available.</p>;
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recently Added Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEmployees.length === 0 ? (
            <p className="text-sm text-slate-500">No employees added yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{employee.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {employee.department} · {employee.site} · Joined {formatDate(employee.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/sub-admin/employees/${employee.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      View
                    </Link>
                    <Link
                      href={`/sub-admin/employees/${employee.id}/assess`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Assess
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Recent Submissions</CardTitle>
          <Link href="/sub-admin/employees" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Go to Employees
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentSubmissions.length === 0 ? (
            <p className="text-sm text-slate-500">No assessments submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{submission.employee.fullName}</p>
                    <p className="text-xs text-slate-500">{formatDate(submission.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={submission.totalScore} />
                    <RemarkBadge remarkScore={submission.remarkScore} remark={submission.remark} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
