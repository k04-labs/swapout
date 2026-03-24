"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, BarChart3, Clock3, UserCheck2, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAppQuery } from "@/hooks/query";

type DashboardStatsPayload = {
  metrics: {
    subAdmins: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
    };
    employeesCount: number;
    assessmentsCount: number;
    averageScore: number;
  };
  recentActivity: Array<{
    id: string;
    totalScore: number;
    remark: string;
    remarkScore: number;
    submittedAt: string;
    employee: {
      id: string;
      fullName: string;
    };
    subAdmin: {
      id: string;
      name: string;
      email: string;
      approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    };
  }>;
  message?: string;
};

type LeaderboardPayload = {
  leaderboard: Array<{
    rank: number;
    id: string;
    name: string;
    email: string;
    image: string | null;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    employeesEnrolled: number;
    assessmentsSubmitted: number;
    averageScore: number;
    consistencyScore: number;
    submissionsLast30Days: number;
    compositeScore: number;
  }>;
  message?: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "SA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`metric-skeleton-${index}`}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`leaderboard-row-${index}`} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={`activity-row-${index}`} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminDashboardClient() {
  const statsQuery = useAppQuery<DashboardStatsPayload>({
    queryKey: ["super-admin-dashboard-stats"],
    url: "/api/super-admin/dashboard/stats",
    fallbackError: "Failed to load dashboard stats.",
  });
  const leaderboardQuery = useAppQuery<LeaderboardPayload>({
    queryKey: ["super-admin-dashboard-leaderboard"],
    url: "/api/super-admin/dashboard/leaderboard",
    fallbackError: "Failed to load leaderboard.",
  });
  const stats = statsQuery.data ?? null;
  const leaderboard = leaderboardQuery.data?.leaderboard ?? [];
  const loading = statsQuery.isLoading || leaderboardQuery.isLoading;
  const error = statsQuery.error?.message ?? leaderboardQuery.error?.message ?? null;

  const metricCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: "Total SubAdmins",
        value: stats.metrics.subAdmins.total,
        description: `${stats.metrics.subAdmins.approved} approved · ${stats.metrics.subAdmins.pending} pending · ${stats.metrics.subAdmins.rejected} rejected`,
        icon: UsersRound,
      },
      {
        label: "Total Employees",
        value: stats.metrics.employeesCount,
        description: "Across all active SubAdmins",
        icon: UserCheck2,
      },
      {
        label: "Assessments Submitted",
        value: stats.metrics.assessmentsCount,
        description: "Platform all-time submissions",
        icon: Clock3,
      },
      {
        label: "Platform Avg Score",
        value: `${stats.metrics.averageScore.toFixed(2)} / 5`,
        description: "Average total score across submissions",
        icon: BarChart3,
      },
    ];
  }, [stats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load dashboard</CardTitle>
          <CardDescription>{error ?? "Unexpected dashboard error."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              void statsQuery.refetch();
              void leaderboardQuery.refetch();
            }}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>SubAdmin Leaderboard</CardTitle>
              <CardDescription>Ranked by assessments, enrollment, and consistency.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/super-admin/sub-admins">
                <ArrowUpRight data-icon="inline-start" />
                Manage SubAdmins
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>SubAdmin</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Consistency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-14 text-center text-muted-foreground">
                      No leaderboard data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">#{entry.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
                            <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.employeesEnrolled}</TableCell>
                      <TableCell>{entry.assessmentsSubmitted}</TableCell>
                      <TableCell>{entry.averageScore.toFixed(2)}</TableCell>
                      <TableCell>{entry.consistencyScore.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.approvalStatus === "APPROVED"
                              ? "success"
                              : entry.approvalStatus === "PENDING"
                                ? "warning"
                                : "danger"
                          }
                          className={cn("capitalize")}
                        >
                          {entry.approvalStatus.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="xs" variant="outline" asChild>
                          <Link href={`/super-admin/sub-admins/${entry.id}`}>
                            <ArrowUpRight data-icon="inline-start" />
                            View
                          </Link>
                        </Button>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submission events across platform.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-md border border-border bg-card p-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {activity.subAdmin.name || activity.subAdmin.email}
                    </span>{" "}
                    submitted assessment for{" "}
                    <span className="font-semibold text-foreground">{activity.employee.fullName}</span>
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{activity.totalScore.toFixed(2)} / 5</Badge>
                      <Badge
                        variant={
                          activity.remarkScore >= 4
                            ? "success"
                            : activity.remarkScore <= 2
                              ? "danger"
                              : "warning"
                        }
                      >
                        {activity.remark}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{formatDate(activity.submittedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
