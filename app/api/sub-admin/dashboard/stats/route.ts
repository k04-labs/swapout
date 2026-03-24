import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { roundToTwo } from "@/lib/scoring";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const subAdmin = await requireApprovedSubAdmin(request);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 30);

    const [employeesCount, submissionStats, recentSubmissions, recentEmployees, staleEmployeesCount] =
      await Promise.all([
        prisma.employee.count({ where: { subAdminId: subAdmin.id } }),
        prisma.assessmentSubmission.aggregate({
          where: { subAdminId: subAdmin.id },
          _count: { _all: true },
          _avg: { totalScore: true },
        }),
        prisma.assessmentSubmission.findMany({
          where: { subAdminId: subAdmin.id },
          select: {
            id: true,
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
            totalScore: true,
            remark: true,
            remarkScore: true,
            submittedAt: true,
          },
          orderBy: { submittedAt: "desc" },
          take: 5,
        }),
        prisma.employee.findMany({
          where: { subAdminId: subAdmin.id },
          select: {
            id: true,
            fullName: true,
            department: true,
            site: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.employee.count({
          where: {
            subAdminId: subAdmin.id,
            OR: [
              { report: null },
              {
                report: {
                  lastAssessedAt: {
                    lt: thresholdDate,
                  },
                },
              },
            ],
          },
        }),
      ]);

    const submissionsCount = submissionStats._count._all;
    const averageScore =
      typeof submissionStats._avg.totalScore === "number"
        ? roundToTwo(submissionStats._avg.totalScore)
        : 0;

    return NextResponse.json({
      metrics: {
        employeesCount,
        submissionsCount,
        averageScore,
        staleEmployeesCount,
      },
      recentEmployees,
      recentSubmissions,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to fetch dashboard stats." }, { status: 500 });
  }
}
