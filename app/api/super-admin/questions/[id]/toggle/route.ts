import { NextResponse } from "next/server"
import { apiValidationError, handleApiError } from "@/lib/api-response"
import { auditLog, getRequestMetadata } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"
import { parseParams } from "@/lib/validation/parse"
import { idParamSchema } from "@/lib/validation/schemas"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  },
) {
  try {
    const superAdmin = await requireSuperAdmin(request)
    const parsedParams = parseParams(await context.params, idParamSchema)
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details)
    }
    const { id } = parsedParams.data

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

    auditLog({
      event: "question_toggled",
      actorId: superAdmin.superAdminId,
      actorRole: "super_admin",
      metadata: {
        questionId: id,
        isActive: question.isActive,
        ...getRequestMetadata(request),
      },
    })

    return NextResponse.json({ question })
  } catch (error) {
    return handleApiError(error, "Failed to toggle question status.", request)
  }
}
