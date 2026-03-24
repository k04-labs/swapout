import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

type Params = {
  id: string
}

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: {
    params: Promise<Params>
  },
) {
  try {
    await requireSuperAdmin(request)
    const { id } = await context.params

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: "SubAdmin not found." }, { status: 404 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: "REJECTED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
        approvedAt: true,
        approvedBy: true,
      },
    })

    return NextResponse.json({ subAdmin: user })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to reject sub-admin." }, { status: 500 })
  }
}

