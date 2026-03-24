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

    const existing = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 })
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
      include: {
        options: {
          orderBy: {
            score: "asc",
          },
        },
      },
    })

    return NextResponse.json({ question })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to toggle question status." }, { status: 500 })
  }
}

