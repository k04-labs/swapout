import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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
        report: true,
        subAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
            approvalStatus: true,
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
            submittedAt: "desc",
          },
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch employee details." }, { status: 500 })
  }
}

