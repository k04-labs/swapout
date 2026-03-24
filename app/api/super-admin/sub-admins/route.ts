import { ApprovalStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { roundToTwo } from "@/lib/scoring"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

const ALLOWED_STATUSES = new Set(Object.values(ApprovalStatus))

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status")

    const where =
      statusParam && ALLOWED_STATUSES.has(statusParam as ApprovalStatus)
        ? { approvalStatus: statusParam as ApprovalStatus }
        : {}

    const [subAdmins, allStatusCounts, employeesGrouped, submissionsGrouped] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          approvalStatus: true,
          approvedAt: true,
          createdAt: true,
        },
      }),
      prisma.user.groupBy({
        by: ["approvalStatus"],
        _count: {
          _all: true,
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
    ])

    const employeeCountMap = new Map(employeesGrouped.map((row) => [row.subAdminId, row._count._all]))
    const submissionMap = new Map(
      submissionsGrouped.map((row) => [
        row.subAdminId,
        {
          count: row._count._all,
          avgScore: row._avg.totalScore ?? 0,
        },
      ]),
    )

    const items = subAdmins.map((subAdmin) => {
      const employeeCount = employeeCountMap.get(subAdmin.id) ?? 0
      const submissionStats = submissionMap.get(subAdmin.id)
      const submissionsCount = submissionStats?.count ?? 0
      const averageScore = submissionStats?.avgScore ? roundToTwo(submissionStats.avgScore) : 0

      return {
        ...subAdmin,
        employeeCount,
        submissionsCount,
        averageScore,
      }
    })

    const counts = {
      all: items.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    }

    let totalSubAdmins = 0
    for (const row of allStatusCounts) {
      totalSubAdmins += row._count._all

      if (row.approvalStatus === "PENDING") counts.pending = row._count._all
      if (row.approvalStatus === "APPROVED") counts.approved = row._count._all
      if (row.approvalStatus === "REJECTED") counts.rejected = row._count._all
    }

    counts.all = totalSubAdmins

    return NextResponse.json({ subAdmins: items, counts })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch sub-admins." }, { status: 500 })
  }
}
