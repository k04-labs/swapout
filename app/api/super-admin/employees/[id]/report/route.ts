import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin-auth";

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
    await requireSuperAdmin(request);
    const { id } = await context.params;

    const employee = await prisma.employee.findUnique({
      where: {
        id,
      },
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
            approvalStatus: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const reports = await prisma.assessmentAiReport.findMany({
      where: {
        employeeId: employee.id,
      },
      include: {
        submission: {
          select: {
            id: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      employee,
      reports: reports.map((report) => ({
        id: report.id,
        provider: report.provider,
        model: report.model,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        submission: report.submission,
        subAdmin: report.subAdmin,
        report: report.report,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch AI reports.", request);
  }
}
