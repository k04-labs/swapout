import { stringify } from "csv-stringify/sync";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { normalizeCompetencyBreakdown } from "@/lib/reporting";
import { roundToTwo } from "@/lib/scoring";

type Params = {
  id: string;
};

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const { id } = await context.params;
    const subAdmin = await requireApprovedSubAdmin(request);

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        subAdminId: subAdmin.id,
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        employeeId: employee.id,
        subAdminId: subAdmin.id,
      },
      orderBy: {
        submittedAt: "asc",
      },
      include: {
        subAdmin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const rows = submissions.map((submission) => {
      const breakdown = normalizeCompetencyBreakdown(submission.competencyBreakdown);
      return {
        "Employee Name": employee.fullName,
        Department: employee.department,
        "Job Role": employee.jobRole,
        Site: employee.site,
        "Assessment Date": submission.submittedAt.toISOString(),
        "Total Score": roundToTwo(submission.totalScore),
        "Remark Score": submission.remarkScore,
        "Remark Label": submission.remark,
        HAZARD_RECOGNITION: breakdown.HAZARD_RECOGNITION,
        INCIDENT_RESPONSE: breakdown.INCIDENT_RESPONSE,
        COMPLIANCE_AWARENESS: breakdown.COMPLIANCE_AWARENESS,
        RISK_ASSESSMENT: breakdown.RISK_ASSESSMENT,
        BEHAVIORAL_ACCOUNTABILITY: breakdown.BEHAVIORAL_ACCOUNTABILITY,
        "Submitted By": submission.subAdmin.name || submission.subAdmin.email,
      };
    });

    const csv = stringify(rows, {
      header: true,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="employee-${employee.id}-history.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to export employee CSV." }, { status: 500 });
  }
}
