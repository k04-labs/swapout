import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin-auth";

type PageParams = {
  id: string;
};

type SearchParams = {
  reportId?: string;
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export default async function SuperAdminEmployeeReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { reportId } = await searchParams;
  const session = await requireSuperAdmin().catch(() => null);

  if (!session) {
    redirect("/super-admin/login");
  }

  if (!reportId) {
    notFound();
  }

  const report = await prisma.assessmentAiReport.findFirst({
    where: {
      id: reportId,
      employeeId: id,
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          department: true,
          jobRole: true,
          site: true,
          createdAt: true,
          subAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      subAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const reportJson = report.report as Record<string, unknown>;
  const strengths = toLines(reportJson.strengths);
  const improvements = toLines(reportJson.improvements);
  const observations = toLines(reportJson.overallObservations);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 bg-white px-4 py-6 text-slate-900 print:max-w-none print:px-0 print:py-0">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold">SwapOut AI Safety Report (SuperAdmin)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Generated on {formatDate(new Date())}
        </p>
      </header>

      <section className="grid gap-3 rounded-md border border-slate-200 p-4 text-sm sm:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-700">Employee:</span> {report.employee.fullName}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Department:</span> {report.employee.department || "N/A"}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Job Role:</span> {report.employee.jobRole || "N/A"}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Site:</span> {report.employee.site || "N/A"}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Assessment Date:</span> {formatDate(report.submission.submittedAt)}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Score:</span> {report.submission.totalScore.toFixed(2)} / 5
        </p>
        <p>
          <span className="font-semibold text-slate-700">SubAdmin:</span> {report.subAdmin.name ?? report.subAdmin.email}
        </p>
        <p>
          <span className="font-semibold text-slate-700">SubAdmin Email:</span> {report.subAdmin.email}
        </p>
      </section>

      <section className="rounded-md border border-slate-200 p-4">
        <h2 className="text-lg font-semibold">AI Summary</h2>
        <p className="mt-2 text-sm text-slate-700">
          {typeof reportJson.summary === "string" ? reportJson.summary : "No AI summary available."}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Strengths</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {strengths.length > 0 ? strengths.map((item, index) => <li key={`s-${index}`}>{item}</li>) : <li>No strengths listed.</li>}
          </ul>
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Improvements</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {improvements.length > 0 ? improvements.map((item, index) => <li key={`i-${index}`}>{item}</li>) : <li>No improvement areas listed.</li>}
          </ul>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 p-4">
        <h3 className="text-sm font-semibold">Observations</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {observations.length > 0 ? observations.map((item, index) => <li key={`o-${index}`}>{item}</li>) : <li>No observations listed.</li>}
        </ul>
      </section>

      <section className="rounded-md border border-slate-200 p-4">
        <h3 className="text-sm font-semibold">Raw AI JSON</h3>
        <pre className="mt-2 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(report.report, null, 2)}
        </pre>
      </section>
    </div>
  );
}
