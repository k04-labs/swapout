import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { roundToTwo } from "@/lib/scoring"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

type Params = {
  id: string
}

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: {
    params: Promise<Params>
  },
) {
  try {
    await requireSuperAdmin(request)
    const { id } = await context.params

    const subAdmin = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        approvalStatus: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!subAdmin) {
      return NextResponse.json({ message: "SubAdmin not found." }, { status: 404 })
    }

    const [employees, submissions, submissionAgg] = await Promise.all([
      prisma.employee.findMany({
        where: {
          subAdminId: subAdmin.id,
        },
        include: {
          report: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.assessmentSubmission.findMany({
        where: {
          subAdminId: subAdmin.id,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              department: true,
              jobRole: true,
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      }),
      prisma.assessmentSubmission.aggregate({
        where: {
          subAdminId: subAdmin.id,
        },
        _count: {
          _all: true,
        },
        _avg: {
          totalScore: true,
        },
      }),
    ])

    const stats = {
      employeesCount: employees.length,
      submissionsCount: submissionAgg._count._all,
      averageScore:
        typeof submissionAgg._avg.totalScore === "number"
          ? roundToTwo(submissionAgg._avg.totalScore)
          : 0,
    }

    return NextResponse.json({
      subAdmin,
      stats,
      employees,
      submissions,
    })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch sub-admin details." }, { status: 500 })
  }
}

