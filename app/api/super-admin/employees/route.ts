import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length > 0
}

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() ?? ""
    const site = searchParams.get("site")?.trim() ?? ""
    const department = searchParams.get("department")?.trim() ?? ""
    const subAdminId = searchParams.get("subAdminId")?.trim() ?? ""

    const filters = {
      ...(q
        ? {
            fullName: {
              contains: q,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(site ? { site } : {}),
      ...(department ? { department } : {}),
      ...(subAdminId ? { subAdminId } : {}),
    }

    const [employees, sites, departments, subAdmins] = await Promise.all([
      prisma.employee.findMany({
        where: filters,
        include: {
          report: true,
          subAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
              approvalStatus: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.employee.findMany({
        distinct: ["site"],
        select: {
          site: true,
        },
        orderBy: {
          site: "asc",
        },
      }),
      prisma.employee.findMany({
        distinct: ["department"],
        select: {
          department: true,
        },
        orderBy: {
          department: "asc",
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          approvalStatus: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ])

    const siteOptions = sites.map((item) => item.site).filter(isNonEmptyString)
    const departmentOptions = departments
      .map((item) => item.department)
      .filter(isNonEmptyString)

    return NextResponse.json({
      employees,
      filters: {
        sites: siteOptions,
        departments: departmentOptions,
        subAdmins,
      },
    })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch employees." }, { status: 500 })
  }
}
