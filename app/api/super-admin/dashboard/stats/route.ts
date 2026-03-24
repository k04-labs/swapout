import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { roundToTwo } from "@/lib/scoring"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)

    const [subAdminStatusCounts, employeesCount, submissionStats, recentSubmissions] = await Promise.all([
      prisma.user.groupBy({
        by: ["approvalStatus"],
        _count: {
          _all: true,
        },
      }),
      prisma.employee.count(),
      prisma.assessmentSubmission.aggregate({
        _count: {
          _all: true,
        },
        _avg: {
          totalScore: true,
        },
      }),
      prisma.assessmentSubmission.findMany({
        orderBy: {
          submittedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          totalScore: true,
          remark: true,
          remarkScore: true,
          submittedAt: true,
          employee: {
            select: {
              id: true,
              fullName: true,
            },
          },
          subAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
              approvalStatus: true,
            },
          },
        },
      }),
    ])

    const counts = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    }

    for (const row of subAdminStatusCounts) {
      const value = row._count._all
      counts.total += value

      if (row.approvalStatus === "APPROVED") counts.approved = value
      if (row.approvalStatus === "PENDING") counts.pending = value
      if (row.approvalStatus === "REJECTED") counts.rejected = value
    }

    const assessmentsCount = submissionStats._count._all
    const averageScore =
      typeof submissionStats._avg.totalScore === "number"
        ? roundToTwo(submissionStats._avg.totalScore)
        : 0

    return NextResponse.json({
      metrics: {
        subAdmins: counts,
        employeesCount,
        assessmentsCount,
        averageScore,
      },
      recentActivity: recentSubmissions,
    })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch dashboard stats." }, { status: 500 })
  }
}

