"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

type TabValue = "ALL" | ApprovalStatus;

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

function SubAdminsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`row-${index}`} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function SuperAdminSubAdminsClient() {
  const [tab, setTab] = useState<TabValue>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [data, setData] = useState<SubAdminsPayload | null>(null);

  async function load(currentTab: TabValue) {
    setLoading(true);
    setError(null);

    try {
      const search = new URLSearchParams();
      if (currentTab !== "ALL") {
        search.set("status", currentTab);
      }

      const response = await fetch(`/api/super-admin/sub-admins?${search.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as SubAdminsPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to fetch sub-admins.");
      }

      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch sub-admins.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(tab);
  }, [tab]);

  const filteredSubAdmins = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.subAdmins;
    return data.subAdmins.filter(
      (subAdmin) =>
        subAdmin.name.toLowerCase().includes(normalized) ||
        subAdmin.email.toLowerCase().includes(normalized),
    );
  }, [data, query]);

  async function runAction(subAdminId: string, action: "approve" | "reject" | "revoke") {
    setActionLoadingId(subAdminId);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/sub-admins/${subAdminId}/${action}`, {
        method: "PATCH",
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? `Failed to ${action} sub-admin.`);
      }

      await load(tab);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${action} sub-admin.`);
    } finally {
      setActionLoadingId(null);
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle>SubAdmin Management</CardTitle>
          <CardDescription>Review and control SubAdmin approvals and platform access.</CardDescription>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
          <TabsList>
            <TabsTrigger value="ALL">All ({data.counts.all})</TabsTrigger>
            <TabsTrigger value="PENDING">Pending ({data.counts.pending})</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved ({data.counts.approved})</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected ({data.counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SubAdmin</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Assessments</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-14 text-center text-muted-foreground">
                  No sub-admins found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubAdmins.map((subAdmin) => (
                <TableRow key={subAdmin.id}>
                  <TableCell>
                    <Link
                      href={`/super-admin/sub-admins/${subAdmin.id}`}
                      className="flex items-center gap-2 hover:opacity-90"
                    >
                      <Avatar size="sm">
                        <AvatarImage src={subAdmin.image ?? undefined} alt={subAdmin.name} />
                        <AvatarFallback>{initials(subAdmin.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{subAdmin.name}</p>
                        <p className="text-xs text-muted-foreground">{subAdmin.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(subAdmin.createdAt)}</TableCell>
                  <TableCell>{subAdmin.employeeCount}</TableCell>
                  <TableCell>{subAdmin.submissionsCount}</TableCell>
                  <TableCell>{subAdmin.averageScore.toFixed(2)}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {subAdmin.approvalStatus === "PENDING" ? (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={actionLoadingId === subAdmin.id}
                            onClick={() => void runAction(subAdmin.id, "approve")}
                          >
                            <Check data-icon="inline-start" />
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={actionLoadingId === subAdmin.id}
                            onClick={() => void runAction(subAdmin.id, "reject")}
                          >
                            <X data-icon="inline-start" />
                            Reject
                          </Button>
                        </>
                      ) : null}

                      {subAdmin.approvalStatus === "APPROVED" ? (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={actionLoadingId === subAdmin.id}
                          onClick={() => void runAction(subAdmin.id, "revoke")}
                        >
                          <RotateCcw data-icon="inline-start" />
                          Revoke
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

