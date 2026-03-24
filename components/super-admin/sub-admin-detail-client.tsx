"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Payload = {
  subAdmin: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    approvedAt: string | null;
    approvedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    employeesCount: number;
    submissionsCount: number;
    averageScore: number;
  };
  employees: Array<{
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
    report: {
      latestScore: number | null;
      latestRemark: string | null;
    } | null;
  }>;
  submissions: Array<{
    id: string;
    totalScore: number;
    remark: string;
    submittedAt: string;
    employee: {
      id: string;
      fullName: string;
      department: string;
      jobRole: string;
    };
  }>;
  message?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`line-${index}`} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminSubAdminDetailClient({ subAdminId }: { subAdminId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/super-admin/sub-admins/${subAdminId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as Payload;

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load sub-admin details.");
        }

        if (mounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load sub-admin details.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [subAdminId]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load SubAdmin profile</CardTitle>
          <CardDescription>{error ?? "No data available."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { subAdmin, stats } = data;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={subAdmin.image ?? undefined} alt={subAdmin.name} />
              <AvatarFallback>{initials(subAdmin.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{subAdmin.name}</CardTitle>
              <CardDescription>{subAdmin.email}</CardDescription>
            </div>
          </div>
          <Badge
            variant={
              subAdmin.approvalStatus === "APPROVED"
                ? "success"
                : subAdmin.approvalStatus === "PENDING"
                  ? "warning"
                  : "danger"
            }
          >
            {subAdmin.approvalStatus}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Joined:</span> {formatDate(subAdmin.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Approved At:</span> {formatDate(subAdmin.approvedAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Employees Enrolled:</span> {stats.employeesCount}
          </p>
          <p>
            <span className="text-muted-foreground">Assessments Submitted:</span> {stats.submissionsCount}
          </p>
          <p>
            <span className="text-muted-foreground">Average Score:</span> {stats.averageScore.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Registered Employees</CardTitle>
            <CardDescription>Read-only list from this SubAdmin workspace.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/super-admin/employees">Open All Employees</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Latest Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-14 text-center text-muted-foreground">
                    No employees registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link href={`/super-admin/employees/${employee.id}`} className="font-medium hover:underline">
                        {employee.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.jobRole}</TableCell>
                    <TableCell>{employee.site}</TableCell>
                    <TableCell>
                      {typeof employee.report?.latestScore === "number"
                        ? `${employee.report.latestScore.toFixed(2)} / 5`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>Latest assessment submissions performed by this SubAdmin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-14 text-center text-muted-foreground">
                    No submissions yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/super-admin/employees/${submission.employee.id}`}
                        className="font-medium hover:underline"
                      >
                        {submission.employee.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{submission.totalScore.toFixed(2)} / 5</TableCell>
                    <TableCell>{submission.remark}</TableCell>
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

