"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAppMutation } from "@/hooks/mutation";
import { useAppQuery } from "@/hooks/query";
import { apiClient } from "@/lib/api-client";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type AiReportShape = {
  generatedAt?: string;
  summary?: string;
  riskLevel?: RiskLevel;
  strengths?: string[];
  improvements?: string[];
  overallObservations?: string[];
  actionPlan?: Array<{
    priority?: "LOW" | "MEDIUM" | "HIGH";
    action?: string;
    rationale?: string;
    timeline?: string;
  }>;
  coachingMessage?: string;
};

type Payload = {
  employee: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
    subAdmin: {
      id: string;
      name: string;
      email: string;
      approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    };
  };
  reports: Array<{
    id: string;
    provider: string;
    model: string;
    createdAt: string;
    updatedAt: string;
    submission: {
      id: string;
      submittedAt: string;
      totalScore: number;
      remark: string;
      remarkScore: number;
    };
    subAdmin: {
      id: string;
      name: string | null;
      email: string;
    };
    report: AiReportShape;
  }>;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function riskVariant(risk: RiskLevel | undefined): "success" | "warning" | "danger" | "outline" {
  if (risk === "LOW") return "success";
  if (risk === "MEDIUM") return "warning";
  if (risk === "HIGH") return "danger";
  return "outline";
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
      </Card>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`sa-ai-report-skeleton-${index}`}>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-60" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SuperAdminEmployeeReportClient({ employeeId }: { employeeId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const reportQuery = useAppQuery<Payload>({
    queryKey: ["super-admin-employee-ai-reports", employeeId],
    url: `/api/super-admin/employees/${employeeId}/report`,
    fallbackError: "Failed to load AI reports.",
  });

  const updateMutation = useAppMutation<
    { report: unknown },
    { reportId: string; report: unknown }
  >({
    mutationKey: ["super-admin-ai-report-update"],
    mutationFn: async ({ reportId, report }) => {
      const { data } = await apiClient.patch<{ report: unknown }>(
        `/api/super-admin/ai-reports/${reportId}`,
        {
          report,
        },
      );
      return data;
    },
    invalidateQueryKeys: [["super-admin-employee-ai-reports", employeeId]],
    fallbackError: "Failed to update AI report.",
  });

  const deleteMutation = useAppMutation<{ success: boolean }, { reportId: string }>({
    mutationKey: ["super-admin-ai-report-delete"],
    mutationFn: async ({ reportId }) => {
      const { data } = await apiClient.delete<{ success: boolean }>(
        `/api/super-admin/ai-reports/${reportId}`,
      );
      return data;
    },
    invalidateQueryKeys: [["super-admin-employee-ai-reports", employeeId]],
    fallbackError: "Failed to delete AI report.",
  });

  const data = reportQuery.data ?? null;
  const activeEditReport = useMemo(
    () => data?.reports.find((report) => report.id === editingReportId) ?? null,
    [data, editingReportId],
  );

  function openEditDialog(reportId: string, report: unknown) {
    setEditingReportId(reportId);
    setEditJson(JSON.stringify(report, null, 2));
    setEditError(null);
    setEditOpen(true);
  }

  async function saveEditedReport() {
    if (!editingReportId) return;
    setEditError(null);

    try {
      const parsed = JSON.parse(editJson) as unknown;
      await updateMutation.mutateAsync({
        reportId: editingReportId,
        report: parsed,
      });
      setEditOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update report.");
    }
  }

  async function deleteReport(reportId: string) {
    const confirmed = window.confirm("Delete this AI report permanently?");
    if (!confirmed) return;

    await deleteMutation.mutateAsync({ reportId });
  }

  if (reportQuery.isLoading) {
    return <ReportSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load reports</CardTitle>
          <CardDescription>{reportQuery.error?.message ?? "No report data available."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{data.employee.fullName}</CardTitle>
            <CardDescription>
              {data.employee.department} · {data.employee.jobRole} · {data.employee.site}
            </CardDescription>
            <p className="mt-1 text-xs text-muted-foreground">
              Owner: {data.employee.subAdmin.name} ({data.employee.subAdmin.email})
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/super-admin/employees/${employeeId}`}>Open Employee Profile</Link>
          </Button>
        </CardHeader>
      </Card>

      {data.reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No AI reports generated yet for this employee.
          </CardContent>
        </Card>
      ) : (
        data.reports.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Assessment: {formatDate(item.submission.submittedAt)}</CardTitle>
                <CardDescription>
                  Score {item.submission.totalScore.toFixed(2)} / 5 · {item.submission.remark} ({item.submission.remarkScore}/5)
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted by {item.subAdmin.name ?? item.subAdmin.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={riskVariant(item.report.riskLevel)}>
                  {item.report.riskLevel ?? "UNKNOWN"} RISK
                </Badge>
                <Badge variant="outline">
                  {item.provider}:{item.model}
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/super-admin/employees/${employeeId}/report/print?reportId=${item.id}`}>
                    Download PDF
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditDialog(item.id, item.report)}>
                  <Pencil data-icon="inline-start" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => void deleteReport(item.id)}>
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
                <p className="mt-1 text-sm text-foreground">
                  {item.report.summary ?? "No summary provided by AI model."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strengths</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-foreground">
                    {(item.report.strengths ?? []).length > 0 ? (
                      item.report.strengths?.map((strength, index) => (
                        <li key={`sa-strength-${item.id}-${index}`}>{strength}</li>
                      ))
                    ) : (
                      <li>No strengths listed.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Improvements</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-foreground">
                    {(item.report.improvements ?? []).length > 0 ? (
                      item.report.improvements?.map((improvement, index) => (
                        <li key={`sa-improvement-${item.id}-${index}`}>{improvement}</li>
                      ))
                    ) : (
                      <li>No improvement areas listed.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coach Message</p>
                <p className="mt-1 text-sm text-foreground">
                  {item.report.coachingMessage ?? "No coaching note available."}
                </p>
              </div>

              <details className="rounded-md border border-border bg-muted/30 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  View Raw AI JSON
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-card p-3 text-xs text-foreground">
                  {JSON.stringify(item.report, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit AI Report JSON</DialogTitle>
            <DialogDescription>
              Update structured report data for report ID: {activeEditReport?.id ?? "N/A"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={editJson}
              onChange={(event) => setEditJson(event.target.value)}
              className="min-h-[360px] font-mono text-xs"
            />
            {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void saveEditedReport()} disabled={updateMutation.isPending}>
                Save JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
