"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { TrendIndicator } from "@/components/sub-admin/trend-indicator";

type EmployeeDetailPayload = {
  message?: string;
  employee?: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    phoneNumber: string;
    site: string;
    createdAt: string;
    report: {
      totalSubmissions: number;
      latestScore: number | null;
      latestRemarkScore: number | null;
      latestRemark: string | null;
      averageScore: number | null;
      trend: "improving" | "declining" | "stable" | null;
      lastAssessedAt: string | null;
    } | null;
    submissions: Array<{
      id: string;
      totalScore: number;
      remark: string;
      remarkScore: number;
      submittedAt: string;
      subAdmin: {
        id: string;
        name: string | null;
        email: string;
      };
    }>;
  };
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeeDetailClient({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<EmployeeDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sub-admin/employees/${employeeId}`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as EmployeeDetailPayload;
        if (!response.ok) {
          throw new Error(
            payload.message ?? "Failed to load employee details.",
          );
        }

        if (mounted) setData(payload);
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load employee details.",
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

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">Loading employee details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const employee = data?.employee;
  if (!employee) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-xl text-slate-900">
            {employee.fullName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {employee.department} · {employee.jobRole} · {employee.site}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href={`/sub-admin/employees/${employee.id}/assess`}>
              Submit Assessment
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/sub-admin/employees/${employee.id}/report`}>
              View Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Department
            </p>
            <p className="mt-0.5 text-slate-700">{employee.department}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Job Role
            </p>
            <p className="mt-0.5 text-slate-700">{employee.jobRole}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Phone
            </p>
            <p className="mt-0.5 text-slate-700">{employee.phoneNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Site
            </p>
            <p className="mt-0.5 text-slate-700">{employee.site}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Enrolled
            </p>
            <p className="mt-0.5 text-slate-700">
              {formatDate(employee.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Last Assessed
            </p>
            <p className="mt-0.5 text-slate-700">
              {formatDate(employee.report?.lastAssessedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Total Assessments
          </p>
          <p className="font-heading text-2xl tracking-tight text-slate-900">
            {employee.report?.totalSubmissions ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Average Score
          </p>
          <ScoreBadge score={employee.report?.averageScore ?? null} />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Latest Remark
          </p>
          <RemarkBadge
            remarkScore={employee.report?.latestRemarkScore ?? null}
            remark={employee.report?.latestRemark ?? null}
          />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Trend
          </p>
          <TrendIndicator trend={employee.report?.trend ?? "stable"} />
        </div>
      </div>

      {/* Assessment history */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">
              Assessment History
            </p>
            <p className="text-xs text-slate-400">
              {employee.submissions.length} total submissions
            </p>
          </div>
          <a
            href={`/api/sub-admin/employees/${employee.id}/export/csv`}
            className="text-[11px] font-medium text-violet-600 hover:text-violet-700"
          >
            Export CSV
          </a>
        </div>
        {employee.submissions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No assessments submitted yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {employee.submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">
                    {formatDate(submission.submittedAt)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    by {submission.subAdmin.name || submission.subAdmin.email}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <ScoreBadge score={submission.totalScore} />
                  <RemarkBadge
                    remarkScore={submission.remarkScore}
                    remark={submission.remark}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
