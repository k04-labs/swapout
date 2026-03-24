import { stringify } from "csv-stringify/sync"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-response"
import { auditLog, getRequestMetadata } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { normalizeCompetencyBreakdown } from "@/lib/reporting"
import { roundToTwo } from "@/lib/scoring"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const superAdmin = await requireSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const subAdminId = searchParams.get("subAdminId")?.trim() ?? ""

    if (subAdminId) {
      const subAdminExists = await prisma.user.findUnique({
        where: { id: subAdminId },
        select: { id: true },
      })

      if (!subAdminExists) {
        return NextResponse.json({ message: "SubAdmin not found." }, { status: 404 })
      }
    }

    const where = subAdminId ? { subAdminId } : {}

    const employees = await prisma.employee.findMany({
      where,
      include: {
        subAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        submissions: {
          include: {
            subAdmin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const rows: Record<string, string | number>[] = []

    for (const employee of employees) {
      if (employee.submissions.length === 0) {
        rows.push({
          "Employee ID": employee.id,
          "Employee Name": employee.fullName,
          Department: employee.department,
          "Job Role": employee.jobRole,
          Site: employee.site,
          "Employee Registered At": employee.createdAt.toISOString(),
          "SubAdmin ID": employee.subAdmin.id,
          "SubAdmin Name": employee.subAdmin.name,
          "SubAdmin Email": employee.subAdmin.email,
          "Assessment Date": "",
          "Total Score": "",
          "Remark Score": "",
          "Remark Label": "",
          HAZARD_RECOGNITION: "",
          INCIDENT_RESPONSE: "",
          COMPLIANCE_AWARENESS: "",
          RISK_ASSESSMENT: "",
          BEHAVIORAL_ACCOUNTABILITY: "",
          "Submitted By": "",
        })
        continue
      }

      for (const submission of employee.submissions) {
        const breakdown = normalizeCompetencyBreakdown(submission.competencyBreakdown)

        rows.push({
          "Employee ID": employee.id,
          "Employee Name": employee.fullName,
          Department: employee.department,
          "Job Role": employee.jobRole,
          Site: employee.site,
          "Employee Registered At": employee.createdAt.toISOString(),
          "SubAdmin ID": employee.subAdmin.id,
          "SubAdmin Name": employee.subAdmin.name,
          "SubAdmin Email": employee.subAdmin.email,
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
        })
      }
    }

    const csv = stringify(rows, {
      header: true,
    })

    auditLog({
      event: "super_admin_export_csv_downloaded",
      actorId: superAdmin.superAdminId,
      actorRole: "super_admin",
      metadata: {
        scopedToSubAdminId: subAdminId || null,
        rowCount: rows.length,
        employeeCount: employees.length,
        ...getRequestMetadata(request),
      },
    })

    const filename = subAdminId
      ? `swapout-export-sub-admin-${subAdminId}.csv`
      : "swapout-export-platform.csv"

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error, "Failed to export platform CSV.", request)
  }
}
