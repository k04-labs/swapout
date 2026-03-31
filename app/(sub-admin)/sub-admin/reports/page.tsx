import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

function formatDate(value: Date | string): string {
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

export default async function SubAdminReportsPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  const reports = await prisma.assessmentAiReport.findMany({
    where: {
      subAdminId: subAdmin.id,
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          department: true,
        },
      },
      submission: {
        select: {
          submittedAt: true,
          totalScore: true,
          remark: true,
          remarkScore: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>AI Reports</CardTitle>
          <CardDescription>
            All AI-generated assessment reports for your registered employees.
          </CardDescription>
        </CardHeader>
      </Card>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No reports available yet. Submit assessments to generate AI reports.
          </CardContent>
        </Card>
      ) : (
        reports.map((report) => {
          const reportJson = report.report as { riskLevel?: RiskLevel; summary?: string };
          return (
            <Card key={report.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{report.employee.fullName}</CardTitle>
                  <CardDescription>
                    {report.employee.department || "N/A"} · Assessment {formatDate(report.submission.submittedAt)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={riskVariant(reportJson.riskLevel)}>
                    {reportJson.riskLevel ?? "UNKNOWN"} RISK
                  </Badge>
                  <Badge variant="outline">
                    {report.submission.totalScore.toFixed(2)} / 5
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/sub-admin/employees/${report.employee.id}/report`}>
                      Open Employee Report
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  {reportJson.summary ?? "No summary available."}
                </p>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
