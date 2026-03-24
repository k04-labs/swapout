"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ALL_FILTER = "__all__";
const ITEMS_PER_PAGE = 10;

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
    trend: "improving" | "declining" | "stable" | null;
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

function initials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AV_COLORS = [
  "bg-emerald-500/20 text-emerald-400",
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-amber-500/20 text-amber-400",
  "bg-rose-500/20 text-rose-400",
  "bg-cyan-500/20 text-cyan-400",
];

function avColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

function scoreColor(score: number) {
  if (score >= 4) return "text-emerald-400";
  if (score >= 3) return "text-blue-400";
  if (score >= 2) return "text-amber-400";
  return "text-rose-400";
}

function scoreBadgeVariant(score: number) {
  if (score >= 4)
    return {
      label: "Excellent",
      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
  if (score >= 3)
    return {
      label: "Good",
      cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
  if (score >= 2)
    return {
      label: "Fair",
      cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
  return {
    label: "Needs Improvement",
    cls: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };
}

function TrendIcon({ trend }: { trend: string | null | undefined }) {
  if (trend === "improving")
    return <TrendingUp className="size-3.5 text-emerald-400" />;
  if (trend === "declining")
    return <TrendingDown className="size-3.5 text-rose-400" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

function trendLabel(trend: string | null | undefined) {
  if (trend === "improving") return "Improving";
  if (trend === "declining") return "Declining";
  return "Stable";
}

/* ---------- Employee Report Dialog ---------- */
function EmployeeReportDialog({ employee }: { employee: Employee }) {
  const avgScore = employee.report?.averageScore ?? 0;
  const badge = scoreBadgeVariant(avgScore);
  const submissions = employee._count.submissions;
  const trend = employee.report?.trend ?? "stable";

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Avatar
            className={cn(
              "size-10 ring-2 ring-border/50",
              avColor(employee.fullName),
            )}
          >
            <AvatarFallback
              className={cn(
                "bg-transparent font-semibold",
                avColor(employee.fullName),
              )}
            >
              {initials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <span className="block">{employee.fullName}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {employee.department}
            </span>
          </div>
        </DialogTitle>
        <DialogDescription>
          Employee performance report and assessment history
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {employee.phoneNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{employee.site}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {employee.subAdmin.email}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Managed by {employee.subAdmin.name}
            </span>
          </div>
        </div>

        {/* Score Overview */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p
                  className={cn(
                    "text-3xl font-bold font-mono",
                    scoreColor(avgScore),
                  )}
                >
                  {avgScore.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average Score
                </p>
                <Badge className={cn("mt-2 text-[10px]", badge.cls)}>
                  {badge.label}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono text-foreground">
                  {submissions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Assessments
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendIcon trend={trend} />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      trend === "improving"
                        ? "text-emerald-400"
                        : trend === "declining"
                          ? "text-rose-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {trendLabel(trend)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Performance Trend
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key dates */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Key Information
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Last Assessed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(employee.report?.lastAssessedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-lg font-bold font-mono",
                    scoreColor(employee.report?.latestScore ?? 0),
                  )}
                >
                  {employee.report?.latestScore?.toFixed(1) ?? "N/A"}
                </span>
                <span className="text-xs text-muted-foreground">/5</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Enrolled
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(employee.createdAt)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="font-normal">
                {employee.jobRole}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" className="gap-2" asChild>
          <Link href={`/super-admin/employees/${employee.id}/report`}>
            <FileText className="size-4" />
            Full Report
          </Link>
        </Button>
        <Button variant="outline" className="gap-2" asChild>
          <a
            href={`/api/super-admin/export/csv?employeeId=${encodeURIComponent(employee.id)}`}
          >
            <Download className="size-4" />
            Export Report
          </a>
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- Skeleton ---------- */
function EmployeesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={`stat-${i}`} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4 flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={`row-${i}`} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Main Component ---------- */
export function SuperAdminEmployeesClient() {
  const [query, setQuery] = useState("");
  const [subAdminId, setSubAdminId] = useState(ALL_FILTER);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

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

        if (normalizedQuery) params.set("q", normalizedQuery);
        if (subAdminId !== ALL_FILTER) params.set("subAdminId", subAdminId);

        const response = await fetch(
          `/api/super-admin/employees?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as EmployeesPayload;

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load employees.");
        }

        setData(payload);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load employees.",
        );
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
  }, [query, subAdminId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, subAdminId]);

  const employees = data?.employees ?? [];

  const totals = useMemo(() => {
    return {
      employees: employees.length,
      active: employees.filter((e) => e.isActive).length,
      submissions: employees.reduce((sum, e) => sum + e._count.submissions, 0),
      avgScore:
        employees.length > 0
          ? employees.reduce(
              (sum, e) => sum + (e.report?.averageScore ?? 0),
              0,
            ) / employees.length
          : 0,
    };
  }, [employees]);

  const totalPages = Math.max(1, Math.ceil(employees.length / ITEMS_PER_PAGE));
  const paginatedEmployees = employees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedEmployees.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedEmployees.map((e) => e.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-primary" />
            All Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage all employees across SubAdmins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <a
              href={`/api/super-admin/export/csv${
                subAdminId !== ALL_FILTER
                  ? `?subAdminId=${encodeURIComponent(subAdminId)}`
                  : ""
              }`}
            >
              <Download className="size-4" />
              Export
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totals.employees}
                </p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totals.active}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totals.submissions}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Assessments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totals.avgScore.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or department..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={subAdminId} onValueChange={setSubAdminId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by SubAdmin" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_FILTER}>All SubAdmins</SelectItem>
                  {data.filters.subAdmins.map((sa) => (
                    <SelectItem key={sa.id} value={sa.id}>
                      {sa.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {selectedRows.length} selected
                  <button
                    onClick={() => setSelectedRows([])}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? <Skeleton className="h-10 w-full" /> : null}

      {/* Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedRows.length === paginatedEmployees.length &&
                    paginatedEmployees.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">SubAdmin</TableHead>
              <TableHead className="text-center">Assessments</TableHead>
              <TableHead className="text-center">Avg Score</TableHead>
              <TableHead className="hidden sm:table-cell">
                Last Assessment
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-16 text-center text-muted-foreground"
                >
                  No employees found for current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => {
                const avgScore = employee.report?.averageScore ?? 0;
                const badge = scoreBadgeVariant(avgScore);
                return (
                  <TableRow
                    key={employee.id}
                    className="border-border/50 hover:bg-accent/30"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(employee.id)}
                        onCheckedChange={() => toggleSelectRow(employee.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={cn(
                            "size-8 ring-1 ring-border/50",
                            avColor(employee.fullName),
                          )}
                        >
                          <AvatarFallback
                            className={cn(
                              "bg-transparent font-semibold text-xs",
                              avColor(employee.fullName),
                            )}
                          >
                            {initials(employee.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {employee.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-normal">
                        {employee.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {employee.subAdmin.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {employee.subAdmin.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-semibold text-foreground">
                        {employee._count.submissions}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={cn(
                            "font-mono font-bold",
                            scoreColor(avgScore),
                          )}
                        >
                          {avgScore.toFixed(1)}
                        </span>
                        <TrendIcon trend={employee.report?.trend} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {formatDate(employee.report?.lastAssessedAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "text-[10px]",
                          employee.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {employee.isActive ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DialogTrigger asChild>
                              <DropdownMenuItem>
                                <Eye className="size-4 mr-2" />
                                View Report
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/employees/${employee.id}`}
                              >
                                <FileText className="size-4 mr-2" />
                                Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/super-admin/employees/${employee.id}/report`}
                              >
                                <FileText className="size-4 mr-2" />
                                Full Report
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <EmployeeReportDialog employee={employee} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {employees.length === 0
              ? 0
              : (currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
            to {Math.min(currentPage * ITEMS_PER_PAGE, employees.length)} of{" "}
            {employees.length} employees
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className="w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
