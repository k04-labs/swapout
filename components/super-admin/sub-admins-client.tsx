"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  UserCheck,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Building2,
  Users,
  Target,
  Eye,
  Edit,
  Trash2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppMutation } from "@/hooks/mutation";
import { useAppQuery } from "@/hooks/query";
import { apiClient } from "@/lib/api-client";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

type SubAdmin = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  createdAt: string;
  employeeCount: number;
  submissionsCount: number;
  averageScore: number;
};

type SubAdminsPayload = {
  subAdmins: SubAdmin[];
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
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

function progressColor(progress: number) {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 60) return "bg-blue-500";
  if (progress >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function TrendIcon({ score }: { score: number }) {
  if (score >= 4) return <TrendingUp className="size-3.5 text-emerald-400" />;
  if (score >= 3) return <Minus className="size-3.5 text-muted-foreground" />;
  return <TrendingDown className="size-3.5 text-rose-400" />;
}

function calcProgress(subAdmin: SubAdmin): number {
  // Derive progress from submissions relative to a reasonable target per employee
  if (subAdmin.employeeCount === 0) return 0;
  const ratio = subAdmin.submissionsCount / (subAdmin.employeeCount * 5);
  return Math.min(100, Math.round(ratio * 100));
}

function relativeTime(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

function SubAdminsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`stat-${i}`} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`card-${i}`} className="h-72 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function SubAdminCard({
  subAdmin,
  onAction,
  actionLoadingId,
}: {
  subAdmin: SubAdmin;
  onAction: (id: string, action: "approve" | "reject" | "revoke") => void;
  actionLoadingId: string | null;
}) {
  const progress = calcProgress(subAdmin);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <Link
            href={`/super-admin/sub-admins/${subAdmin.id}`}
            className="flex items-center gap-3 hover:opacity-90"
          >
            <Avatar
              className={cn(
                "size-12 ring-2 ring-border/50",
                avColor(subAdmin.name),
              )}
            >
              <AvatarImage
                src={subAdmin.image ?? undefined}
                alt={subAdmin.name}
              />
              <AvatarFallback
                className={cn(
                  "bg-transparent font-semibold text-lg",
                  avColor(subAdmin.name),
                )}
              >
                {initials(subAdmin.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{subAdmin.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3" />
                {subAdmin.email.split("@")[1]}
              </p>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/super-admin/sub-admins/${subAdmin.id}`}>
                  <Eye data-icon="inline-start" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {subAdmin.approvalStatus === "APPROVED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onAction(subAdmin.id, "revoke")}
                    disabled={actionLoadingId === subAdmin.id}
                  >
                    <Trash2 data-icon="inline-start" />
                    Revoke
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3" />
            <span className="truncate">{subAdmin.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/50 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-foreground">
              {subAdmin.employeeCount}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Employees
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-foreground">
              {subAdmin.submissionsCount}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Assessments
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p
                className={cn(
                  "text-lg font-bold font-mono",
                  scoreColor(subAdmin.averageScore),
                )}
              >
                {subAdmin.averageScore.toFixed(1)}
              </p>
              <TrendIcon score={subAdmin.averageScore} />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg Score
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-semibold text-foreground">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressColor(progress),
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <span>Joined {formatDate(subAdmin.createdAt)}</span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {relativeTime(subAdmin.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingSubAdminRow({
  subAdmin,
  onAction,
  actionLoadingId,
}: {
  subAdmin: SubAdmin;
  onAction: (id: string, action: "approve" | "reject" | "revoke") => void;
  actionLoadingId: string | null;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
      <Avatar
        className={cn("size-10 ring-1 ring-border/50", avColor(subAdmin.name))}
      >
        <AvatarImage src={subAdmin.image ?? undefined} alt={subAdmin.name} />
        <AvatarFallback
          className={cn("bg-transparent font-semibold", avColor(subAdmin.name))}
        >
          {initials(subAdmin.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <Link
          href={`/super-admin/sub-admins/${subAdmin.id}`}
          className="font-medium text-foreground truncate hover:underline"
        >
          {subAdmin.name}
        </Link>
        <p className="text-xs text-muted-foreground truncate">
          {subAdmin.email}
        </p>
      </div>
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium text-foreground">
          {subAdmin.email.split("@")[1]}
        </p>
      </div>
      <div className="hidden md:block text-right">
        <p className="text-xs text-muted-foreground">Applied</p>
        <p className="text-sm font-medium text-foreground">
          {formatDate(subAdmin.createdAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0 gap-1.5"
          disabled={actionLoadingId === subAdmin.id}
          onClick={() => onAction(subAdmin.id, "approve")}
        >
          <CheckCircle2 className="size-3.5" />
          <span className="hidden sm:inline">Approve</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 gap-1.5"
          disabled={actionLoadingId === subAdmin.id}
          onClick={() => onAction(subAdmin.id, "reject")}
        >
          <XCircle className="size-3.5" />
          <span className="hidden sm:inline">Reject</span>
        </Button>
      </div>
    </div>
  );
}

export function SuperAdminSubAdminsClient() {
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const subAdminsQuery = useAppQuery<SubAdminsPayload>({
    queryKey: ["super-admin-sub-admins"],
    url: "/api/super-admin/sub-admins",
    fallbackError: "Failed to fetch sub-admins.",
  });
  const actionMutation = useAppMutation<
    { message?: string },
    { subAdminId: string; action: "approve" | "reject" | "revoke" }
  >({
    mutationKey: ["super-admin-sub-admin-action"],
    mutationFn: async ({ subAdminId, action }) => {
      const { data } = await apiClient.patch<{ message?: string }>(
        `/api/super-admin/sub-admins/${subAdminId}/${action}`,
      );
      return data;
    },
    invalidateQueryKeys: [["super-admin-sub-admins"]],
    fallbackError: "Failed to update sub-admin.",
  });
  const data = subAdminsQuery.data ?? null;
  const loading = subAdminsQuery.isLoading;
  const actionLoadingId = actionMutation.isPending
    ? actionMutation.variables?.subAdminId ?? null
    : null;
  const error = actionError ?? subAdminsQuery.error?.message ?? null;

  const approvedSubAdmins = useMemo(() => {
    if (!data) return [];
    return data.subAdmins.filter((s) => s.approvalStatus === "APPROVED");
  }, [data]);

  const pendingSubAdmins = useMemo(() => {
    if (!data) return [];
    return data.subAdmins.filter((s) => s.approvalStatus === "PENDING");
  }, [data]);

  const filteredApproved = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return approvedSubAdmins;
    return approvedSubAdmins.filter(
      (s) =>
        s.name.toLowerCase().includes(normalized) ||
        s.email.toLowerCase().includes(normalized),
    );
  }, [approvedSubAdmins, query]);

  async function runAction(
    subAdminId: string,
    action: "approve" | "reject" | "revoke",
  ) {
    setActionError(null);

    try {
      await actionMutation.mutateAsync({ subAdminId, action });
    } catch (actionError) {
      setActionError(
        actionError instanceof Error
          ? actionError.message
          : `Failed to ${action} sub-admin.`,
      );
    }
  }

  if (loading) {
    return <SubAdminsSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SubAdmins</CardTitle>
          <CardDescription>{error ?? "No data available."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalEmployees = data.subAdmins.reduce(
    (acc, s) => acc + s.employeeCount,
    0,
  );
  const totalAssessments = data.subAdmins.reduce(
    (acc, s) => acc + s.submissionsCount,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Sub Admins
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all SubAdmins and their progress tracking
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {data.counts.approved}
                </p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {data.counts.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totalEmployees}
                </p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <Target className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">
                  {totalAssessments}
                </p>
                <p className="text-xs text-muted-foreground">
                  Assessments Done
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Tabs */}
      <Tabs defaultValue="approved" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="approved" className="gap-2">
              Approved
              <Badge
                variant="secondary"
                className="size-5 p-0 justify-center text-[10px]"
              >
                {data.counts.approved}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge className="size-5 p-0 justify-center text-[10px] bg-amber-500/20 text-amber-400">
                {data.counts.pending}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search SubAdmins..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Sort by Name</DropdownMenuItem>
                <DropdownMenuItem>Sort by Score</DropdownMenuItem>
                <DropdownMenuItem>Sort by Employees</DropdownMenuItem>
                <DropdownMenuItem>Sort by Progress</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="approved" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredApproved.map((subAdmin) => (
              <SubAdminCard
                key={subAdmin.id}
                subAdmin={subAdmin}
                onAction={runAction}
                actionLoadingId={actionLoadingId}
              />
            ))}
          </div>
          {filteredApproved.length === 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <UserCheck className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  No SubAdmins Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  No SubAdmins match your search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {pendingSubAdmins.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <Clock className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  No Pending Requests
                </h3>
                <p className="text-sm text-muted-foreground">
                  All sub-admin requests have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-amber-500/20 py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-amber-400" />
                    <CardTitle className="text-base text-amber-400">
                      Pending Approval Requests
                    </CardTitle>
                  </div>
                  <CardDescription className="text-amber-400/70">
                    {pendingSubAdmins.length} requests waiting
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-amber-500/10">
                  {pendingSubAdmins.map((subAdmin) => (
                    <PendingSubAdminRow
                      key={subAdmin.id}
                      subAdmin={subAdmin}
                      onAction={runAction}
                      actionLoadingId={actionLoadingId}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
