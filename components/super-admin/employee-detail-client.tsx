"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { TrendIndicator } from "@/components/sub-admin/trend-indicator";

type Payload = {
  employee: {
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
    subAdmin: {
      id: string;
      name: string;
      email: string;
      approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    };
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
  message?: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`line-${index}`} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-2 pt-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`row-${index}`} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminEmployeeDetailClient({ employeeId }: { employeeId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/super-admin/employees/${employeeId}`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as Payload;

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load employee details.");
        }

        if (mounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load employee details.");
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

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!data || error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load employee profile</CardTitle>
          <CardDescription>{error ?? "No employee data available."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const employee = data.employee;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{employee.fullName}</CardTitle>
            <CardDescription>
              {employee.department} · {employee.jobRole} · {employee.site}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/super-admin/employees">
                <ArrowLeft data-icon="inline-start" />
                Back
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/super-admin/employees/${employee.id}/report`}>
                <FileText data-icon="inline-start" />
                Open Report
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <span className="text-muted-foreground">Phone:</span> {employee.phoneNumber}
          </p>
          <p>
            <span className="text-muted-foreground">Enrolled:</span> {formatDate(employee.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Last Assessed:</span> {formatDate(employee.report?.lastAssessedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Owner SubAdmin:</span> {employee.subAdmin.name}
          </p>
          <p>
            <span className="text-muted-foreground">Owner Email:</span> {employee.subAdmin.email}
          </p>
          <p>
            <span className="text-muted-foreground">Total Submissions:</span> {employee.report?.totalSubmissions ?? 0}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Latest Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={employee.report?.latestScore ?? null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBadge score={employee.report?.averageScore ?? null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Latest Remark</CardDescription>
          </CardHeader>
          <CardContent>
            <RemarkBadge
              remarkScore={employee.report?.latestRemarkScore ?? null}
              remark={employee.report?.latestRemark ?? null}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Trend</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendIndicator trend={employee.report?.trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>All submissions recorded for this employee.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {employee.submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    No submissions yet for this employee.
                  </TableCell>
                </TableRow>
              ) : (
                employee.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                    <TableCell>
                      {submission.subAdmin.name ?? "Unknown"}
                      <p className="text-xs text-muted-foreground">{submission.subAdmin.email}</p>
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={submission.totalScore} />
                    </TableCell>
                    <TableCell>
                      <RemarkBadge remarkScore={submission.remarkScore} remark={submission.remark} />
                    </TableCell>
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
