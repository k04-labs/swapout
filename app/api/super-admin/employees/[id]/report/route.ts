import type { CompetencyCategory } from "@prisma/client"
import { NextResponse } from "next/server"
import { normalizeCompetencyBreakdown } from "@/lib/reporting"
import { prisma } from "@/lib/prisma"
import { defaultCompetencyBreakdown, getRemarkFromScoreBand, roundToTwo } from "@/lib/scoring"
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

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        subAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
            approvalStatus: true,
          },
        },
        report: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 })
    }

    const submissions = await prisma.assessmentSubmission.findMany({
      where: {
        employeeId: employee.id,
      },
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
    })

    const competencyTotals = defaultCompetencyBreakdown()
    const competencyCounts = defaultCompetencyBreakdown()

    for (const submission of submissions) {
      const breakdown = normalizeCompetencyBreakdown(submission.competencyBreakdown)

      for (const key of Object.keys(competencyTotals) as CompetencyCategory[]) {
        const value = breakdown[key]
        if (value > 0) {
          competencyTotals[key] += value
          competencyCounts[key] += 1
        }
      }
    }

    const competencyAverage = defaultCompetencyBreakdown()
    for (const key of Object.keys(competencyAverage) as CompetencyCategory[]) {
      const count = competencyCounts[key]
      competencyAverage[key] = count > 0 ? roundToTwo(competencyTotals[key] / count) : 0
    }

    const trendSeries = [...submissions].reverse().map((submission) => ({
      date: submission.submittedAt,
      score: roundToTwo(submission.totalScore),
      remark: submission.remark,
    }))

    const latestRemarkMeta = getRemarkFromScoreBand(employee.report?.latestRemarkScore ?? null)

    return NextResponse.json({
      employee,
      report: employee.report
        ? {
            ...employee.report,
            latestRemarkDescription: latestRemarkMeta?.description ?? null,
          }
        : null,
      submissions,
      trendSeries,
      competencyAverage,
    })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch employee report." }, { status: 500 })
  }
}

