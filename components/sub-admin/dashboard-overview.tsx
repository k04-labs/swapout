"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardCheck,
  MoreHorizontal,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";

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

function toInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length <= 1) return value.slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const AV_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-slate-500">{payload[0]?.value}</p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-3.5 w-48" />
        </div>
        <Skeleton className="h-8 w-36" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`metric-skeleton-${index}`}
            className="rounded-xl border border-slate-200/80 bg-white p-4"
          >
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-4">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-52 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-48 mb-4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sub-admin/dashboard/stats", {
          cache: "no-store",
        });
        const payload = (await response.json()) as DashboardStats & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load dashboard.");
        }

        if (mounted) {
          setData(payload);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard.",
          );
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

  const scoreTrendData = useMemo(() => {
    if (!data) return [];
    return [...data.recentSubmissions]
      .sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      )
      .map((submission) => ({
        label: new Date(submission.submittedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: submission.totalScore,
      }));
  }, [data]);

  const volumeData = useMemo(() => {
    if (!data) return [];

    const groups = data.recentSubmissions.reduce<Record<string, number>>(
      (accumulator, submission) => {
        const key = new Date(submission.submittedAt).toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
          },
        );
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    return Object.entries(groups).map(([label, count]) => ({ label, count }));
  }, [data]);

  const filteredSubmissions = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data.recentSubmissions;
    const normalized = query.trim().toLowerCase();
    return data.recentSubmissions.filter((item) =>
      item.employee.fullName.toLowerCase().includes(normalized),
    );
  }, [data, query]);

  if (loading) {
    return <DashboardOverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6">
        <p className="text-sm font-medium text-slate-800">
          Unable to load dashboard
        </p>
        <p className="mt-1 text-xs text-slate-500">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          size="sm"
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const metrics = [
    {
      label: "Total Employees",
      value: data.metrics.employeesCount,
      description: "Registered under your account",
      icon: Users,
    },
    {
      label: "Assessments Done",
      value: data.metrics.submissionsCount,
      description: "Total completed sessions",
      icon: ClipboardCheck,
    },
    {
      label: "Average Score",
      value: data.metrics.averageScore.toFixed(1),
      valueSuffix: "/5",
      description: "Latest overall employee baseline",
      icon: ArrowUpRight,
    },
    {
      label: "Needs Reassessment",
      value: data.metrics.staleEmployeesCount,
      description: "No assessment in 30 days",
      icon: ShieldAlert,
    },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Operational snapshot for employees, assessments & activity.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sub-admin/employees">
              <BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5" />
              Manage Employees
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200/80 bg-white p-4 hover:shadow-sm transition-shadow"
          >
            <div className="mb-3 flex items-start justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {metric.label}
              </p>
              <metric.icon className="h-4 w-4 text-slate-300" />
            </div>
            <p className="font-heading text-2xl tracking-tight text-slate-900">
              {metric.value}
              {"valueSuffix" in metric && (
                <span className="font-sans text-sm font-normal text-slate-400">
                  {metric.valueSuffix}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Score trend */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Score Trend</p>
              <p className="text-xs text-slate-400">
                Recent score movement from submissions
              </p>
            </div>
            {scoreTrendData.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                <TrendingUp className="h-3 w-3" /> Active
              </span>
            )}
          </div>
          {scoreTrendData.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
              No score trend data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={scoreTrendData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient
                    id="dashboard-score-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#dashboard-score-gradient)"
                  dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recently added employees */}
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">Recently Added</p>
            <p className="text-xs text-slate-400">Newest employee profiles</p>
          </div>
          <div className="divide-y divide-slate-100/80">
            {data.recentEmployees.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No employees added yet.
              </p>
            ) : (
              data.recentEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-black/5 ${avColor(employee.fullName)}`}
                  >
                    {toInitials(employee.fullName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                      {employee.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate leading-tight">
                      {employee.department} · {employee.site}
                    </p>
                  </div>
                  <Link
                    href={`/sub-admin/employees/${employee.id}`}
                    className="text-[11px] font-medium text-violet-600 hover:text-violet-700 shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent submissions */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Recent Submissions
              </p>
              <p className="text-xs text-slate-400">
                Last completed assessments
              </p>
            </div>
            <div className="relative w-48">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employee..."
                className="h-8 pl-8 text-xs border-slate-200 bg-slate-50"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100/80">
            {filteredSubmissions.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No matches found.
              </p>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors"
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-black/5 ${avColor(submission.employee.fullName)}`}
                  >
                    {toInitials(submission.employee.fullName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                      {submission.employee.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate leading-tight">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <ScoreBadge score={submission.totalScore} />
                    <RemarkBadge
                      remarkScore={submission.remarkScore}
                      remark={submission.remark}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-md p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/sub-admin/employees/${submission.employee.id}`}
                          >
                            Open Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/sub-admin/employees/${submission.employee.id}/report`}
                          >
                            Open Report
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submission volume + stats */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-800">
              Submission Volume
            </p>
            <p className="text-xs text-slate-400">Daily submission count</p>
          </div>
          <div className="h-40">
            {volumeData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
                Not enough data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={volumeData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#ede9fe"
                    radius={[3, 3, 0, 0]}
                    activeBar={{ fill: "#7c3aed" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Employees enrolled</p>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {data.metrics.employeesCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Completed submissions</p>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {data.metrics.submissionsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Overdue reassessment</p>
              <span
                className={`font-mono text-xs font-semibold ${data.metrics.staleEmployeesCount > 0 ? "text-amber-600" : "text-emerald-600"}`}
              >
                {data.metrics.staleEmployeesCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
