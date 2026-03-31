"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppQuery } from "@/hooks/query";

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

type ReportPayload = {
  employee: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
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
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
      </Card>
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={`ai-report-skeleton-${index}`}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportClient({ employeeId }: { employeeId: string }) {
  const reportQuery = useAppQuery<ReportPayload>({
    queryKey: ["sub-admin-employee-ai-reports", employeeId],
    url: `/api/sub-admin/employees/${employeeId}/report`,
    fallbackError: "Failed to load AI reports.",
  });

  const data = reportQuery.data ?? null;

  if (reportQuery.isLoading) {
    return <ReportSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load reports</CardTitle>
          <CardDescription>
            {reportQuery.error?.message ?? "No report data available."}
          </CardDescription>
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
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/sub-admin/employees/${employeeId}`}>Open Employee Profile</Link>
          </Button>
        </CardHeader>
      </Card>

      {data.reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No AI reports generated yet. Submit an assessment to generate the first report.
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
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={riskVariant(item.report.riskLevel)}>
                  {item.report.riskLevel ?? "UNKNOWN"} RISK
                </Badge>
                <Badge variant="outline">
                  {item.provider}:{item.model}
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/sub-admin/employees/${employeeId}/report/print?reportId=${item.id}`}>
                    Download PDF
                  </Link>
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
                        <li key={`strength-${item.id}-${index}`}>{strength}</li>
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
                        <li key={`improvement-${item.id}-${index}`}>{improvement}</li>
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
    </div>
  );
}
