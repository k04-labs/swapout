import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

type PageParams = {
  id: string;
};

function formatDate(value: Date | null | undefined): string {
  if (!value) return "N/A";
  return value.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatScore(value: number | null | undefined): string {
  return typeof value === "number" ? `${value.toFixed(2)} / 5` : "N/A";
}

export default async function SubAdminEmployeeReportPrintPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id,
      subAdminId: subAdmin.id,
    },
    include: {
      report: true,
      submissions: {
        include: {
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!employee) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 bg-white px-4 py-6 text-slate-900 print:max-w-none print:px-0 print:py-0">
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold">SwapOut Employee Progress Report</h1>
        <p className="mt-1 text-sm text-slate-600">Generated on {formatDate(new Date())}</p>
      </header>

      <section className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm sm:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-700">Employee:</span> {employee.fullName}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Department:</span> {employee.department}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Job Role:</span> {employee.jobRole}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Phone:</span> {employee.phoneNumber}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Site:</span> {employee.site}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Enrolled:</span> {formatDate(employee.createdAt)}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Submissions</p>
          <p className="mt-2 text-xl font-semibold">{employee.report?.totalSubmissions ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Latest Score</p>
          <p className="mt-2 text-xl font-semibold">{formatScore(employee.report?.latestScore)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average Score</p>
          <p className="mt-2 text-xl font-semibold">{formatScore(employee.report?.averageScore)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Trend</p>
          <p className="mt-2 text-xl font-semibold capitalize">{employee.report?.trend ?? "Stable"}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold">Assessment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Remark</th>
                <th className="px-3 py-2">Questions Answered</th>
              </tr>
            </thead>
            <tbody>
              {employee.submissions.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No submissions recorded yet.
                  </td>
                </tr>
              ) : (
                employee.submissions.map((submission) => (
                  <tr key={submission.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{formatDate(submission.submittedAt)}</td>
                    <td className="px-3 py-2">{formatScore(submission.totalScore)}</td>
                    <td className="px-3 py-2">
                      {submission.remarkScore} • {submission.remark}
                    </td>
                    <td className="px-3 py-2">{submission._count.responses}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
