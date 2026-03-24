"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";

const ALL_FILTER = "__all__";

type Employee = {
  id: string;
  fullName: string;
  department: string;
  jobRole: string;
  phoneNumber: string;
  site: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subAdmin: {
    id: string;
    name: string;
    email: string;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  };
  report: {
    totalSubmissions: number;
    latestScore: number | null;
    latestRemarkScore: number | null;
    latestRemark: string | null;
    averageScore: number | null;
    lastAssessedAt: string | null;
  } | null;
  _count: {
    submissions: number;
  };
};

type EmployeesPayload = {
  employees: Employee[];
  filters: {
    sites: string[];
    departments: string[];
    subAdmins: Array<{
      id: string;
      name: string;
      email: string;
      approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
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

function EmployeesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-3 w-72" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`filters-${index}`} className="h-9 w-full" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`rows-${index}`} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function SuperAdminEmployeesClient() {
  const [query, setQuery] = useState("");
  const [site, setSite] = useState(ALL_FILTER);
  const [department, setDepartment] = useState(ALL_FILTER);
  const [subAdminId, setSubAdminId] = useState(ALL_FILTER);

  const [data, setData] = useState<EmployeesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        const normalizedQuery = query.trim();

        if (normalizedQuery) {
          params.set("q", normalizedQuery);
        }
        if (site !== ALL_FILTER) {
          params.set("site", site);
        }
        if (department !== ALL_FILTER) {
          params.set("department", department);
        }
        if (subAdminId !== ALL_FILTER) {
          params.set("subAdminId", subAdminId);
        }

        const response = await fetch(`/api/super-admin/employees?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as EmployeesPayload;

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load employees.");
        }

        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load employees.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    const timeout = setTimeout(() => {
      void load();
    }, 220);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, site, department, subAdminId]);

  const totals = useMemo(() => {
    const rows = data?.employees ?? [];
    return {
      employees: rows.length,
      submissions: rows.reduce((sum, employee) => sum + employee._count.submissions, 0),
      avgScore:
        rows.length > 0
          ? rows.reduce((sum, employee) => sum + (employee.report?.latestScore ?? 0), 0) / rows.length
          : 0,
    };
  }, [data]);

  if (loading && !data) {
    return <EmployeesSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>{error ?? "No data available."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl text-foreground">{totals.employees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Submissions in View</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl text-foreground">{totals.submissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Latest Score</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl text-foreground">{totals.avgScore.toFixed(2)} / 5</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Filter Scope</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Platform-wide visibility across all SubAdmins.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Platform Employees</CardTitle>
              <CardDescription>
                Search and audit employee progress by site, department, and SubAdmin owner.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a
                href={`/api/super-admin/export/csv${
                  subAdminId !== ALL_FILTER ? `?subAdminId=${encodeURIComponent(subAdminId)}` : ""
                }`}
              >
                <Download data-icon="inline-start" />
                Export CSV
              </a>
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employee"
                className="pl-9"
              />
            </div>

            <Select value={site} onValueChange={setSite}>
              <SelectTrigger className="w-full" size="default">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_FILTER}>All Sites</SelectItem>
                  {data.filters.sites.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-full" size="default">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_FILTER}>All Departments</SelectItem>
                  {data.filters.departments.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={subAdminId} onValueChange={setSubAdminId}>
              <SelectTrigger className="w-full" size="default">
                <SelectValue placeholder="All SubAdmins" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_FILTER}>All SubAdmins</SelectItem>
                  {data.filters.subAdmins.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {loading ? <Skeleton className="h-10 w-full" /> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>SubAdmin</TableHead>
                <TableHead>Last Assessed</TableHead>
                <TableHead>Latest Score</TableHead>
                <TableHead>Latest Remark</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-16 text-center text-muted-foreground">
                    No employees found for current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{employee.fullName}</p>
                        <p className="text-xs text-muted-foreground">{employee.phoneNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.jobRole}</TableCell>
                    <TableCell>{employee.site}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-foreground">{employee.subAdmin.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.subAdmin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(employee.report?.lastAssessedAt)}</TableCell>
                    <TableCell>
                      <ScoreBadge score={employee.report?.latestScore ?? null} />
                    </TableCell>
                    <TableCell>
                      <RemarkBadge
                        remarkScore={employee.report?.latestRemarkScore ?? null}
                        remark={employee.report?.latestRemark ?? null}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="outline" asChild>
                          <Link href={`/super-admin/employees/${employee.id}`}>
                            <ArrowUpRight data-icon="inline-start" />
                            Profile
                          </Link>
                        </Button>
                        <Button size="xs" variant="outline" asChild>
                          <Link href={`/super-admin/employees/${employee.id}/report`}>
                            <FileText data-icon="inline-start" />
                            Report
                          </Link>
                        </Button>
                      </div>
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
