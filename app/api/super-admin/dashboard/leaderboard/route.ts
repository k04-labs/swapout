import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { roundToTwo } from "@/lib/scoring"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [subAdmins, employeesBySubAdmin, submissionsBySubAdmin, recentSubmissionsBySubAdmin] =
      await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            approvalStatus: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
        prisma.employee.groupBy({
          by: ["subAdminId"],
          _count: {
            _all: true,
          },
        }),
        prisma.assessmentSubmission.groupBy({
          by: ["subAdminId"],
          _count: {
            _all: true,
          },
          _avg: {
            totalScore: true,
          },
        }),
        prisma.assessmentSubmission.groupBy({
          by: ["subAdminId"],
          where: {
            submittedAt: {
              gte: thirtyDaysAgo,
            },
          },
          _count: {
            _all: true,
          },
        }),
      ])

    const employeeCountMap = new Map(employeesBySubAdmin.map((row) => [row.subAdminId, row._count._all]))
    const submissionMap = new Map(
      submissionsBySubAdmin.map((row) => [
        row.subAdminId,
        {
          assessmentsSubmitted: row._count._all,
          avgScore: row._avg.totalScore ?? 0,
        },
      ]),
    )
    const recentSubmissionMap = new Map(
      recentSubmissionsBySubAdmin.map((row) => [row.subAdminId, row._count._all]),
    )

    const leaderboard = subAdmins
      .map((subAdmin) => {
        const employeesEnrolled = employeeCountMap.get(subAdmin.id) ?? 0
        const submissionStats = submissionMap.get(subAdmin.id)
        const assessmentsSubmitted = submissionStats?.assessmentsSubmitted ?? 0
        const averageScore = submissionStats?.avgScore ? roundToTwo(submissionStats.avgScore) : 0
        const submissionsLast30Days = recentSubmissionMap.get(subAdmin.id) ?? 0
        const consistencyScore = roundToTwo(submissionsLast30Days / (30 / 7))

        const compositeScore = roundToTwo(
          assessmentsSubmitted * 0.5 + employeesEnrolled * 0.3 + consistencyScore * 0.2,
        )

        return {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          image: subAdmin.image,
          approvalStatus: subAdmin.approvalStatus,
          employeesEnrolled,
          assessmentsSubmitted,
          averageScore,
          consistencyScore,
          submissionsLast30Days,
          compositeScore,
        }
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }))

    return NextResponse.json({ leaderboard })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch leaderboard." }, { status: 500 })
  }
}

